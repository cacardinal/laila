# CRM API Reference (user-supplied)

This file is a template. Replace it with the API mechanics of YOUR CRM so that agents (`crm-searcher`, `meeting-prep-assembler`) can read one authoritative reference instead of re-deriving query syntax every session.

Document at minimum:

## Endpoint + auth

- Base URL (e.g. `http://localhost:3000/graphql` for a self-hosted Twenty instance)
- Where the API key lives: an UNTRACKED env file (never commit it; `.gitignore` already excludes `.env*`)
- How to load the key safely in shell (quote the exact command, including any gotchas — a grep pattern that silently matches nothing returns an empty key and produces confusing "unauthenticated" errors downstream)

## Hot-path queries

Paste 3-5 working queries for your most common lookups:

- Find a person by name → record ID, company, role
- Find a company and its open opportunities/tasks
- Read notes attached to a record
- Update a pipeline stage (Tier 1 candidates only — see `config/autonomy-rules.json`)

## Gotchas

Record every trap you hit once so no session hits it twice: pagination caps, composite-field filter syntax, endpoints that differ from the docs, fields that require a different API surface.
