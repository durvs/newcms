# 0003 — Peppered password hashing; roles via `capabilities` usermeta

## Context

Passwords need modern hashing (WordPress's phpass is not acceptable), and
bcrypt silently truncates input at 72 bytes. Authorization needs WP-style
roles/capabilities.

## Decision

`hashPassword(password, secret)` in `@newcms/auth` computes
`bcrypt(HMAC-SHA384(secret, password))`. The HMAC pre-hash removes the 72-byte
limit and acts as a pepper: the `AUTH_SECRET` env var is required to verify
any password. Legacy plain-bcrypt hashes still verify and are rehashed on
login.

Roles are stored per user in the `capabilities` usermeta as JSON
(`{"administrator": true}`); role→capability maps live in the `user_roles`
option. `AuthGuard` loads roles from that meta; users without it default to
`subscriber`.

## Consequences

- **Seed and API must share the same `AUTH_SECRET`** — hashing with one secret
  and verifying with another fails silently as "wrong password".
- Rotating `AUTH_SECRET` invalidates all passwords (acceptable for a demo).
- Every seeded/created privileged user needs the `capabilities` meta row, or
  they get 403 on all capability-gated endpoints despite logging in fine.
