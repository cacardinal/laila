// Laila dashboard client. Tabbed views over the aggregate endpoints.
// Everything is text-first: status chips always carry a label, numbers use
// tabular numerals, and identity never rides on color. All dynamic values
// pass through esc() before touching innerHTML — comms, briefs, CRM, and
// home-automation data are information-channel content.

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ── Theme ────────────────────────────────────────────────────────────────────
const themeBtn = $("theme-toggle");
const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TAB_LOADERS = {}; // tab -> loader fn, registered below
$("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $(`view-${btn.dataset.tab}`).classList.remove("hidden");
  TAB_LOADERS[btn.dataset.tab]?.();
});

// ── Shared renderers ─────────────────────────────────────────────────────────
const chip = (cls, label) => `<span class="chip ${cls}">${esc(label)}</span>`;
const table = (headers, rows) =>
  rows.length
    ? `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`
    : `<div class="empty">Nothing here.</div>`;
const tile = (label, value, note) =>
  `<div class="tile"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="note">${esc(note || "")}</div></div>`;

// Minimal markdown renderer for trusted-shape repo files (strategy, briefs).
// Escapes first, then formats — bold, headers, lists, hr, paragraphs.
function md(src) {
  const lines = esc(src).split("\n");
  let html = "", inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  for (const raw of lines) {
    const line = raw.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
    if (/^### /.test(line)) { closeList(); html += `<h4>${line.slice(4)}</h4>`; }
    else if (/^## /.test(line)) { closeList(); html += `<h3>${line.slice(3)}</h3>`; }
    else if (/^# /.test(line)) { closeList(); html += `<h2 class="md-title">${line.slice(2)}</h2>`; }
    else if (/^[-*] /.test(line)) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${line.slice(2)}</li>`; }
    else if (/^\s*$/.test(line)) { closeList(); }
    else if (/^&gt; /.test(line)) { closeList(); html += `<p class="md-quote">${line.slice(5)}</p>`; }
    else { closeList(); html += `<p>${line}</p>`; }
  }
  closeList();
  return html;
}

function loopChip(status) {
  if (["ok", "healthy"].includes(status)) return chip("good", "✓ ok");
  if (["failing", "error"].includes(status)) return chip("bad", "✗ failing");
  return chip("warn", `– ${status || "unknown"}`);
}

// ── Home tab ─────────────────────────────────────────────────────────────────
async function renderHome() {
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
    $("crm").innerHTML = `<div class="empty">CRM proxy is configured but the instance is unreachable.</div>`;
  }
}

// ── Strategy / Briefs ────────────────────────────────────────────────────────
async function renderStrategy() {
  const s = await fetch("/api/strategy").then((r) => r.json());
  $("strategy").innerHTML = s.markdown ? md(s.markdown) : `<div class="empty">No state/strategy.md yet.</div>`;
}

async function renderBriefs(date) {
  const b = await fetch(`/api/briefs${date ? `?date=${encodeURIComponent(date)}` : ""}`).then((r) => r.json());
  $("brief-picker").innerHTML = b.available
    .map((d) => (d === b.showing ? `<strong>${esc(d)}</strong>` : `<a href="#" data-brief="${esc(d)}">${esc(d)}</a>`))
    .join(" · ");
  $("brief").innerHTML = b.markdown ? md(b.markdown) : `<div class="empty">No briefs yet — the daily-brief loop writes them to state/briefs/daily/.</div>`;
}
$("brief-picker")?.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-brief]");
  if (a) { e.preventDefault(); renderBriefs(a.dataset.brief); }
});

// ── Review ───────────────────────────────────────────────────────────────────
async function renderReview() {
  const [o, audit] = await Promise.all([
    fetch("/api/overview").then((r) => r.json()),
    fetch("/api/audit").then((r) => r.json()),
  ]);
  const briefRows = o.brief.items.map(
    (b) => `<tr><td class="num">${esc(b.id)}</td><td>${esc(b.summary || b.title)}</td><td>${chip("plain", b.source || "brief")}</td><td>${chip("warn", "pending")}</td></tr>`
  );
  $("review-pending").innerHTML = table(["ID", "Item", "Source", "Status"], briefRows);
  $("audit").innerHTML = table(
    ["ID", "When", "Action", "Detail", "Rule"],
    (audit.entries || [])
      .slice()
      .reverse()
      .map(
        (a) =>
          `<tr><td class="num">${esc(a.id)}</td><td class="num">${esc((a.timestamp || "").replace("T", " ").slice(0, 16))}</td><td>${chip(
            "good",
            `tier ${a.tier}`
          )} ${esc(a.action)}</td><td>${esc(a.detail)}</td><td class="num">${esc(a.rule || "")}</td></tr>`
      )
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────
async function renderMessages() {
  const o = await fetch("/api/overview").then((r) => r.json());
  $("messages").innerHTML = table(
    ["ID", "From", "Item", "Channel", "Disposition"],
    o.comms.events.map(
      (e) =>
        `<tr><td class="num">${esc(e.id)}</td><td>${esc(e.from || "")}</td><td>${esc(e.summary)}</td><td>${chip("plain", e.source)}</td><td>${
          e.triage?.tier === 1 ? chip("good", "tier 1 · auto") : chip("warn", "tier 3 · propose")
        }</td></tr>`
    )
  );
}

// ── Calendar ─────────────────────────────────────────────────────────────────
async function renderCalendar() {
  const cal = await fetch("/api/calendar").then((r) => r.json());
  $("cal-note").textContent = cal.generated_at ? `snapshot from ${cal.generated_at.slice(0, 10)} (${cal.timezone || ""})` : "";
  const byDate = {};
  for (const ev of cal.events || []) (byDate[ev.date] ||= []).push(ev);
  const days = Object.keys(byDate).sort();
  $("calendar").innerHTML = days.length
    ? days
        .map(
          (d) =>
            `<div class="cal-day"><h3 class="cal-date">${esc(d)}</h3>${byDate[d]
              .map(
                (ev) =>
                  `<div class="cal-event"><span class="num">${esc(ev.start)}–${esc(ev.end)}</span> ${esc(ev.title)} ${chip("plain", ev.calendar)}</div>`
              )
              .join("")}</div>`
        )
        .join("")
    : `<div class="empty">No calendar snapshot — a loop refreshes state/calendar-snapshot.json from the calendar of record.</div>`;
}

// ── Loops ────────────────────────────────────────────────────────────────────
async function renderLoops() {
  const o = await fetch("/api/overview").then((r) => r.json());
  $("loops").innerHTML = table(
    ["Loop", "Schedule", "Last run", "Status"],
    o.loops.items.map(
      (l) =>
        `<tr><td>${esc(l.label)}</td><td class="num">${esc(l.schedule)}</td><td class="num">${esc(l.last_run || "—")}</td><td>${loopChip(l.status)}</td></tr>`
    )
  );
}

// ── House (home automation) ──────────────────────────────────────────────────
function deviceChip(d) {
  if (d.flag) return chip("warn", `⚠ ${d.state} · ${d.flag}`);
  if (["on", "unlocked", "open", "heat", "cool", "playing"].includes(d.state)) return chip("good", d.state);
  return chip("plain", d.state);
}

async function renderHomeAuto() {
  const h = await fetch("/api/home").then((r) => r.json());
  $("ha-source").textContent = h.source === "live" ? "live from Home Assistant" : "sample data (docs/home-automation.md)";
  $("ha-alerts").innerHTML = (h.alerts || [])
    .map((a) => `<div class="card alert-${esc(a.severity)}">${chip(a.severity === "warn" ? "warn" : "bad", a.severity)} ${esc(a.text)}</div>`)
    .join("");
  const rooms = h.rooms || groupLiveEntities(h.entities || []);
  $("ha-rooms").innerHTML = rooms
    .map(
      (room) =>
        `<div class="domain"><h3>${esc(room.name)}</h3>${(room.devices || [])
          .map(
            (d) =>
              `<div class="device-row"><span>${esc(d.name)}</span><span>${deviceChip(d)}${actionBtn(h.actions_enabled, d)}</span></div>`
          )
          .join("")}</div>`
    )
    .join("") || `<div class="empty">No devices.</div>`;
  $("ha-scenes").innerHTML = (h.scenes || []).length
    ? `<div class="scene-row">${h.scenes
        .map((s) => `<button class="scene-btn" data-entity="${esc(s.entity_id)}" ${h.actions_enabled ? "" : "disabled"}>${esc(s.name)}</button>`)
        .join("")}</div><div class="muted" style="padding:0 0 12px">${
        h.actions_enabled
          ? "Scene activations are Tier 1: allowlisted, reversible, and logged to the autonomy audit."
          : "Actions disabled. Set HA_ALLOW_ACTIONS=true after reading docs/home-automation.md."
      }</div>`
    : `<div class="empty">No scenes defined.</div>`;
}

function groupLiveEntities(entities) {
  // Live HA mode has no room metadata without area registry calls; group by domain.
  const byDomain = {};
  for (const e of entities) (byDomain[e.domain] ||= []).push(e);
  return Object.entries(byDomain).map(([name, devices]) => ({ name, devices }));
}

function actionBtn(enabled, d) {
  if (!enabled || !["light", "switch", "media_player"].includes(d.domain)) return "";
  const service = ["on", "playing"].includes(d.state) ? "turn_off" : "turn_on";
  return ` <button class="scene-btn" data-entity="${esc(d.entity_id)}" data-service="${service}">${service === "turn_on" ? "on" : "off"}</button>`;
}

$("view-homeauto").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-entity]");
  if (!btn || btn.disabled) return;
  const service = btn.dataset.service || "turn_on";
  btn.disabled = true;
  const r = await fetch("/api/home/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity_id: btn.dataset.entity, service }),
  }).then((x) => x.json()).catch(() => ({ error: "network" }));
  btn.disabled = false;
  if (r.error) alertBanner(`Action refused: ${r.error}`);
  else renderHomeAuto();
});

function alertBanner(text) {
  $("ha-alerts").innerHTML = `<div class="card alert-warn">${chip("warn", "note")} ${esc(text)}</div>` + $("ha-alerts").innerHTML;
}

// ── Wire + start ─────────────────────────────────────────────────────────────
Object.assign(TAB_LOADERS, {
  home: renderHome,
  strategy: renderStrategy,
  briefs: () => renderBriefs(),
  review: renderReview,
  messages: renderMessages,
  calendar: renderCalendar,
  loops: renderLoops,
  homeauto: renderHomeAuto,
});
renderHome();
setInterval(() => {
  const active = document.querySelector("#tabs button.active")?.dataset.tab;
  if (active) TAB_LOADERS[active]?.();
}, 60_000);
