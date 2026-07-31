#!/usr/bin/env node
// Laila dashboard — zero-dependency Node server (Node 18+).
// Serves the static UI, aggregates state files into JSON endpoints, and
// optionally proxies to two local services so the browser never sees a key:
//   - Twenty CRM GraphQL (docs/crm-twenty.md)
//   - Home Assistant (docs/home-automation.md) — reads free, actions gated

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(__dirname, "public");

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
const HA_URL = (process.env.HA_URL || "").replace(/\/$/, "");
const HA_TOKEN = process.env.HA_TOKEN || "";
const HA_ALLOW_ACTIONS = process.env.HA_ALLOW_ACTIONS === "true";
// Only these Home Assistant domains may be actuated from the dashboard.
// Locks are deliberately absent: a door that unlocks from a web page is not
// "reversible and invisible to others" and does not belong on a Tier 1 surface.
const HA_ACTION_DOMAINS = new Set(["light", "switch", "scene", "climate", "media_player"]);

const readJson = (rel) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
};
const readText = (rel) => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf8");
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
    ha: { configured: Boolean(HA_URL && HA_TOKEN), actions: HA_ALLOW_ACTIONS },
  };
}

function domains() {
  const dir = path.join(ROOT, "domains");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const md = readText(path.join("domains", d.name, "tracking", "status.md")) || "";
      return {
        name: d.name,
        updated: md.match(/\*\*Last updated:\*\*\s*(\S+)/)?.[1] || null,
        focus:
          md
            .match(/## Current Focus\n\n([\s\S]*?)(\n## |$)/)?.[1]
            ?.trim()
            .replace(/\n/g, " ") || null,
      };
    });
}

function briefs(dateParam) {
  const dir = path.join(ROOT, "state", "briefs", "daily");
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().reverse();
  } catch {
    /* none yet */
  }
  const wanted = dateParam && files.includes(`${dateParam}.md`) ? `${dateParam}.md` : files[0] || null;
  return {
    available: files.map((f) => f.replace(".md", "")),
    showing: wanted ? wanted.replace(".md", "") : null,
    markdown: wanted ? readText(path.join("state", "briefs", "daily", wanted)) : null,
  };
}

function homeState() {
  // Live read from Home Assistant when configured; the sample file otherwise.
  if (HA_URL && HA_TOKEN) {
    return fetch(`${HA_URL}/api/states`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}` },
    })
      .then((r) => r.json())
      .then((states) => ({
        source: "live",
        generated_at: new Date().toISOString(),
        actions_enabled: HA_ALLOW_ACTIONS,
        entities: states.map((s) => ({
          entity_id: s.entity_id,
          name: s.attributes?.friendly_name || s.entity_id,
          domain: s.entity_id.split(".")[0],
          state: s.state,
        })),
      }))
      .catch((e) => {
        // Hub unreachable (down, TLS, wrong URL): degrade to the snapshot file
        // so the tab stays useful, and say why.
        const sample = readJson("state/home-automation.json") || { rooms: [], scenes: [], alerts: [] };
        return {
          ...sample,
          source: "sample (hub unreachable)",
          hub_error: String(e && e.cause ? e.cause.code || e.cause : e),
          actions_enabled: false,
        };
      });
  }
  const sample = readJson("state/home-automation.json") || { rooms: [], scenes: [], alerts: [] };
  return Promise.resolve({ ...sample, actions_enabled: HA_ALLOW_ACTIONS });
}

function auditAppend(entry) {
  const p = path.join(ROOT, "state", "autonomy-audit.json");
  const log = readJson("state/autonomy-audit.json") || { entries: [] };
  const nextNum =
    Math.max(0, ...log.entries.map((e) => Number((e.id || "").replace(/^AA-/, "")) || 0)) + 1;
  entry.id = `AA-${nextNum}`;
  entry.timestamp = new Date().toISOString();
  log.entries.push(entry);
  fs.writeFileSync(p, JSON.stringify(log, null, 2) + "\n");
  return entry.id;
}

async function homeAction(req, res) {
  if (!HA_URL || !HA_TOKEN || !HA_ALLOW_ACTIONS) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ error: "actions_disabled", hint: "set HA_ALLOW_ACTIONS=true (docs/home-automation.md)" })
    );
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "bad_json" }));
  }
  const { entity_id, service } = body || {};
  const domain = String(entity_id || "").split(".")[0];
  if (!HA_ACTION_DOMAINS.has(domain) || !/^[a-z_]+$/.test(String(service || ""))) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "domain_not_allowlisted", domain }));
  }
  try {
    const upstream = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${HA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ entity_id }),
    });
    const auditId = auditAppend({
      tier: 1,
      actor: "dashboard",
      action: `home.${domain}.${service}`,
      detail: `${service} -> ${entity_id} (via dashboard)`,
      reversible: true,
      rule: "home-automation allowlist",
    });
    res.writeHead(upstream.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: upstream.ok, audit_id: auditId }));
  } catch (err) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ha_unreachable", detail: String(err) }));
  }
}

async function proxyGraphql(req, res) {
  if (!CRM_URL || !CRM_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "crm_not_configured" }));
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
  const json = (obj) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  try {
    if (url.pathname === "/api/overview") return json(overview());
    if (url.pathname === "/api/domains") return json(domains());
    if (url.pathname === "/api/strategy") return json({ markdown: readText("state/strategy.md") });
    if (url.pathname === "/api/briefs") return json(briefs(url.searchParams.get("date")));
    if (url.pathname === "/api/calendar") return json(readJson("state/calendar-snapshot.json") || { events: [] });
    if (url.pathname === "/api/audit") return json(readJson("state/autonomy-audit.json") || { entries: [] });
    if (url.pathname === "/api/home") return json(await homeState());
    if (url.pathname === "/api/home/action" && req.method === "POST") return homeAction(req, res);
    if (url.pathname === "/graphql" && req.method === "POST") return proxyGraphql(req, res);

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
  console.log(
    `Laila dashboard: http://127.0.0.1:${PORT} (CRM proxy: ${CRM_URL && CRM_KEY ? "on" : "off"}, HA: ${
      HA_URL && HA_TOKEN ? (HA_ALLOW_ACTIONS ? "live, actions on" : "live, read-only") : "sample data"
    })`
  );
});
