# 0005 — All runtime env vars declared in turbo `globalEnv`

## Context

Turbo 2 runs tasks in strict environment mode: env vars not declared in
`turbo.json` are stripped from task environments. Locally this is invisible
because packages load `.env` themselves via `dotenv` inside the process. In
CI there is no `.env`, and the first CI run failed with an empty
`DB_PASSWORD` during `db:migrate`.

## Decision

Every env var read by any task at runtime is declared in `globalEnv` in
`turbo.json` (`DB_*`, `REDIS_*`, `AUTH_SECRET`, `ADMIN_PASSWORD`, `API_PORT`,
`WEB_PORT`, `API_URL`). Strict mode stays on — it keeps cache keys honest.

## Consequences

- **Adding a `process.env` read anywhere requires adding the var to
  `globalEnv`** — treat this as part of the change, not a follow-up.
- Vars in `globalEnv` participate in turbo's cache key; changing their values
  invalidates task caches (that's correct behavior).
