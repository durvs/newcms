# @newcms/auth

Authentication, password hashing, sessions, nonces, and role-based capabilities for NewCMS.

## Installation

```bash
npm install @newcms/auth
# or
pnpm add @newcms/auth
```

**Peer dependency:** If you use the `SessionManager`, you also need [ioredis](https://github.com/redis/ioredis) v5+:

```bash
npm install ioredis
```

## Password Hashing

Passwords are hashed using **bcrypt** with an **HMAC-SHA384 pre-hash**. The pre-hash step eliminates bcrypt's 72-byte input limit, ensuring full entropy is captured for long passwords.

```ts
import { hashPassword, verifyPassword } from '@newcms/auth';

const SECRET_KEY = process.env.AUTH_SECRET_KEY!;

// Hash a password
const hash = await hashPassword('my-password', SECRET_KEY);

// Verify a password
const result = await verifyPassword('my-password', hash, SECRET_KEY);
// result.valid      - true if the password matches
// result.needsRehash - true if the hash uses outdated rounds or legacy format
```

`verifyPassword` is backward-compatible: it recognises both the current HMAC+bcrypt format and plain bcrypt hashes from earlier versions, returning `needsRehash: true` for the latter so you can transparently upgrade stored hashes.

## Nonces (CSRF Protection)

Nonces are HMAC-based tokens tied to a specific action and user. They are valid for 24 hours (two 12-hour ticks), so a freshly created nonce is guaranteed to work for at least 12 hours.

```ts
import { createNonce, verifyNonce } from '@newcms/auth';

const SECRET_KEY = process.env.AUTH_SECRET_KEY!;
const userId = 42;

// Generate a nonce
const nonce = createNonce('save-post', userId, SECRET_KEY);

// Verify a nonce
const status = verifyNonce(nonce, 'save-post', userId, SECRET_KEY);
// 1 = valid, fresh   (0-12 hours old)
// 2 = valid, aging    (12-24 hours old)
// 0 = invalid / expired
```

## Roles and Capabilities

A WordPress-compatible role/capability system with five built-in roles: **administrator**, **editor**, **author**, **contributor**, and **subscriber**.

```ts
import { DEFAULT_ROLES, roleHasCapability, userHasCapability } from '@newcms/auth';

// Check if a role has a capability
roleHasCapability('editor', 'edit_posts');        // true
roleHasCapability('subscriber', 'edit_posts');     // false

// Check if a user (by their roles) has a capability
const userRoles = ['author'];
userHasCapability(userRoles, 'publish_posts');     // true
userHasCapability(userRoles, 'manage_options');     // false

// You can also pass per-user capability overrides
userHasCapability(
  ['subscriber'],
  'upload_files',
  { upload_files: true },  // extra capabilities granted to this user
);  // true
```

The `DEFAULT_ROLES` object contains the full capability map for each role and can be used to seed your database or to inspect capabilities at runtime.

## Application Passwords

Application passwords provide stateless API authentication via HTTP Basic Auth. The raw password is shown to the user once; only the SHA-256 hash is stored.

```ts
import {
  generateAppPassword,
  hashAppPassword,
  verifyAppPassword,
} from '@newcms/auth';

// Generate a new application password
const { raw, hash } = generateAppPassword();
// raw  = "abCD eFgH iJkL mNop qRsT uVwX"  (shown once to the user)
// hash = SHA-256 hex string                  (stored in the database)

// Verify an incoming password (spaces are stripped automatically)
const isValid = verifyAppPassword('abCDeFgHiJkLmNopqRsTuVwX', hash);
```

## Session Manager

A Redis-backed session manager with O(1) create/validate/destroy and automatic TTL expiration (default 14 days).

```ts
import Redis from 'ioredis';
import { SessionManager } from '@newcms/auth';

const redis = new Redis();
const sessions = new SessionManager(redis);

// Create a session
const { token, session } = await sessions.create({
  userId: 42,
  ip: '203.0.113.1',
  userAgent: 'Mozilla/5.0 ...',
  ttlSeconds: 7 * 24 * 3600,  // optional, default 14 days
});
// Give `token` to the client (e.g., in a cookie)

// Validate a session
const data = await sessions.validate(42, token);
if (data) {
  console.log('Session is valid, logged in at', data.loginTime);
}

// List all sessions for a user
const allSessions = await sessions.listByUser(42);

// Destroy a single session (logout)
await sessions.destroy(42, token);

// Destroy all sessions for a user (e.g., after password change)
await sessions.destroyAllForUser(42);
```

### SessionData

| Field       | Type     | Description                        |
|-------------|----------|------------------------------------|
| `userId`    | `number` | The authenticated user's ID        |
| `ip`        | `string` | IP address at login time           |
| `userAgent` | `string` | User-Agent header at login time    |
| `loginTime` | `number` | Unix timestamp of session creation |
| `expiresAt` | `number` | Unix timestamp of session expiry   |

## License

GPL-2.0-or-later
