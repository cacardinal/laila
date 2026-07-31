#!/usr/bin/env node
// Laila OS dashboard — zero-dependency Node server (Node 18+).
// Serves the static UI, aggregates state files into JSON endpoints, and
// optionally proxies /graphql to a Twenty CRM instance so the browser
// never sees the API key. See docs/crm-twenty.md.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(__dirname, "public");

// Load KEY=VALUE pairs from the repo's untracked .env without overriding
// anything already exported by the caller (launchd plists export explicitly).
(function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
})();

const PORT = Number(process.env.DASHBOARD_PORT || 5175);
const CRM_URL = process.env.CRM_GRAPHQL_URL || "";
const CRM_KEY = process.env.CRM_API_KEY || "";

const readJson = (rel) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
};

function overview() {
  const tasks = readJson("state/active-tasks.json");
  const brief = readJson("state/running-brief.json");
  const comms = readJson("state/comms-queue.json");
  const loops = readJson("state/loops-registry.json");
  const staleMs = 72 * 3600 * 1000;
  const now = Date.now();
  const taskList = tasks?.tasks || [];
  return {
    generated_at: new Date().toISOString(),
    tasks: {
      items: taskList,
      active: taskList.filter((t) => t.status !== "done").length,
      stale: taskList.filter(
        (t) => t.status !== "done" && (!t.last_checked || now - Date.parse(t.last_checked) > staleMs)
      ).length,
    },
    brief: { items: brief?.items || brief?.pending || [] },
    comms: { events: (comms?.events || []).filter((e) => e.status === "pending") },
    loops: { items: loops?.loops || [] },
    crm_configured: Boolean(CRM_URL && CRM_KEY),
  };
}

function domains() {
  const dir = path.join(ROOT, "domains");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const statusPath = path.join(dir, d.name, "tracking", "status.md");
      let updated = null;
      let focus = null;
      try {
        const md = fs.readFileSync(statusPath, "utf8");
        updated = md.match(/\*\*Last updated:\*\*\s*(\S+)/)?.[1] || null;
        focus =
          md
            .match(/## Current Focus\n\n([\s\S]*?)(\n## |$)/)?.[1]
            ?.trim()
            .replace(/\n/g, " ") || null;
      } catch {
        /* no tracking file — still list the domain */
      }
      return { name: d.name, updated, focus };
    });
}

async function proxyGraphql(req, res) {
  if (!CRM_URL || !CRM_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "crm_not_configured" }));
    return;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    const upstream = await fetch(CRM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRM_KEY}` },
      body: Buffer.concat(chunks),
    });
    res.writeHead(upstream.status, { "Content-Type": "application/json" });
    res.end(await upstream.text());
  } catch (err) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "crm_unreachable", detail: String(err) }));
  }
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/api/overview") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(overview()));
    }
    if (url.pathname === "/api/domains") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(domains()));
    }
    if (url.pathname === "/graphql" && req.method === "POST") return proxyGraphql(req, res);

    // Static files, path-traversal safe.
    const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = path.join(PUBLIC, path.normalize(rel));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Laila OS dashboard: http://127.0.0.1:${PORT} (CRM proxy: ${CRM_URL && CRM_KEY ? "on" : "off"})`);
});
