// Laila dashboard client. Reads the aggregate endpoints and renders
// tiles + tables. Everything is text-first: status chips always carry a
// label, numbers use tabular numerals, and identity never rides on color.

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Theme toggle: three states — follow system (default), forced light, forced dark.
const themeBtn = $("theme-toggle");
const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
themeBtn.addEventListener("click", () => {
  const cur = document.documentElement.dataset.theme;
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});

const chip = (cls, label) => `<span class="chip ${cls}">${esc(label)}</span>`;
const table = (headers, rows) =>
  rows.length
    ? `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`
    : `<div class="empty">Nothing here.</div>`;

function tile(label, value, note) {
  return `<div class="tile"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="note">${esc(note || "")}</div></div>`;
}

function loopChip(status) {
  if (status === "ok" || status === "healthy") return chip("good", "✓ ok");
  if (status === "failing" || status === "error") return chip("bad", "✗ failing");
  return chip("warn", `– ${status || "unknown"}`);
}

async function render() {
  const [o, doms] = await Promise.all([
    fetch("/api/overview").then((r) => r.json()),
    fetch("/api/domains").then((r) => r.json()),
  ]);

  $("generated").textContent = `as of ${new Date(o.generated_at).toLocaleTimeString()}`;

  const loopsOk = o.loops.items.filter((l) => ["ok", "healthy"].includes(l.status)).length;
  $("tiles").innerHTML = [
    tile("Active tasks", o.tasks.active, o.tasks.stale ? `${o.tasks.stale} stale` : "none stale"),
    tile("Pending comms", o.comms.events.length, "awaiting triage/approval"),
    tile("Brief items", o.brief.items.length, "in the running brief"),
    tile("Loops healthy", `${loopsOk}/${o.loops.items.length}`, "background jobs"),
  ].join("");

  $("tasks").innerHTML = table(
    ["ID", "Task", "Owner", "Status", "Next check"],
    o.tasks.items.map(
      (t) =>
        `<tr><td class="num">${esc(t.id)}</td><td>${esc(t.title || t.task)}</td><td>${chip("plain", t.owner)}</td><td>${
          t.status === "done" ? chip("good", "✓ done") : chip("plain", t.status || "open")
        }</td><td class="num">${esc(t.next_check || "—")}</td></tr>`
    )
  );

  const commsRows = o.comms.events.map(
    (e) =>
      `<tr><td class="num">${esc(e.id)}</td><td>${esc(e.summary)}</td><td>${chip("plain", e.source)}</td><td>${
        e.triage?.tier === 1 ? chip("good", "tier 1 · auto") : chip("warn", "tier 3 · propose")
      }</td></tr>`
  );
  const briefRows = o.brief.items.map(
    (b) =>
      `<tr><td class="num">${esc(b.id)}</td><td>${esc(b.summary || b.title)}</td><td>${chip("plain", b.source || "brief")}</td><td>${chip(
        "warn",
        "pending"
      )}</td></tr>`
  );
  $("comms").innerHTML = table(["ID", "Item", "Source", "Disposition"], [...commsRows, ...briefRows]);

  $("loops").innerHTML = table(
    ["Loop", "Schedule", "Last run", "Status"],
    o.loops.items.map(
      (l) =>
        `<tr><td>${esc(l.label)}</td><td class="num">${esc(l.schedule)}</td><td class="num">${esc(l.last_run || "—")}</td><td>${loopChip(
          l.status
        )}</td></tr>`
    )
  );

  $("domains").innerHTML = doms
    .map(
      (d) =>
        `<div class="domain"><h3>${esc(d.name)}</h3><div class="muted">updated ${esc(d.updated || "unknown")}</div><p>${esc(
          d.focus || "No tracking file yet."
        )}</p></div>`
    )
    .join("");

  renderCrm(o.crm_configured);
}

async function renderCrm(configured) {
  if (!configured) {
    $("crm").innerHTML =
      `<div class="empty hint">CRM proxy not configured. Set <code>CRM_GRAPHQL_URL</code> and <code>CRM_API_KEY</code> in <code>.env</code> to show live pipeline counts from a self-hosted <a href="https://github.com/twentyhq/twenty">Twenty</a> instance — see <code>docs/crm-twenty.md</code>.</div>`;
    return;
  }
  try {
    const q = { query: `query { people(first: 60) { totalCount } opportunities(first: 60) { totalCount } tasks(first: 60) { totalCount } }` };
    const r = await fetch("/graphql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
    const data = (await r.json()).data;
    $("crm").innerHTML = `<div class="tiles" style="margin:12px 0">${[
      tile("People", data.people.totalCount, "contacts in Twenty"),
      tile("Opportunities", data.opportunities.totalCount, "pipeline records"),
      tile("Tasks", data.tasks.totalCount, "synced with reminders"),
    ].join("")}</div>`;
  } catch {
    $("crm").innerHTML = `<div class="empty">CRM proxy is configured but the instance is unreachable — is Twenty up at its configured URL?</div>`;
  }
}

render();
setInterval(render, 60_000);
