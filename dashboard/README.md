# Dashboard

A zero-dependency status page over the repo's state files. One Node process, no build step, no packages.

```bash
node dashboard/server.js
# → http://127.0.0.1:5175
```

## Tabs

- **Home** — stat tiles, active tasks with owners and staleness, domain cards, CRM counts
- **Strategy** — `state/strategy.md`, rendered
- **Briefs** — `state/briefs/daily/*.md`, latest first with a date picker
- **Review** — the running brief (pending your call) and the autonomy audit (`state/autonomy-audit.json`, what ran on its own)
- **Messages** — the comms queue, each row labeled Tier 1 (auto) or Tier 3 (propose)
- **Calendar** — agenda view of `state/calendar-snapshot.json`
- **Loops** — `state/loops-registry.json` with last-run and status
- **House** — home automation: sample snapshot by default, live [Home Assistant](https://www.home-assistant.io/) via server-side proxy when configured; device/scene actions require `HA_ALLOW_ACTIONS=true`, hit a fixed domain allowlist (never locks), and append to the autonomy audit (`docs/home-automation.md`)

The CRM panel uses the same pattern as before: server-side proxy to a self-hosted [Twenty](https://github.com/twentyhq/twenty), key never in the browser.

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
