# Dashboard

A zero-dependency status page over the repo's state files. One Node process, no build step, no packages.

```bash
node dashboard/server.js
# → http://127.0.0.1:5175
```

## What it shows

- **Stat tiles** — active/stale tasks, pending comms, running-brief items, loop health
- **Active tasks** — `state/active-tasks.json`, with owner and staleness
- **Pending comms + brief** — `state/comms-queue.json` and `state/running-brief.json`, each row labeled Tier 1 (auto) or Tier 3 (propose)
- **Background loops** — `state/loops-registry.json` with last-run and status
- **Domains** — one card per `domains/*/tracking/status.md` (last-updated + current focus)
- **CRM panel** — live People/Opportunities/Tasks counts from a self-hosted [Twenty](https://github.com/twentyhq/twenty) instance, via the server-side proxy

## CRM proxy

Set in `.env` (see `.env.example`):

```
CRM_GRAPHQL_URL=http://localhost:3000/graphql
CRM_API_KEY=<from Twenty Settings → Developers>
```

The browser talks only to this server; the API key never leaves the backend. Unset, the CRM panel shows a setup hint and everything else works. Full integration guide: `docs/crm-twenty.md`.

## Notes

- Binds to `127.0.0.1` only. If you expose it beyond localhost (VPN, tailnet), remember the proxy forwards authenticated CRM queries — treat the port accordingly.
- All rendered values are HTML-escaped before insertion; comms summaries and CRM fields are information-channel content and get no exemption.
- Run it as a background service with `launchagents/com.lailaos.dashboard.plist.template`.
- Theme follows the system, with a manual light/dark toggle (persisted in localStorage).
