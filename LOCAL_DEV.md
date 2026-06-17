# Running the webapp locally

This app is multi-tenant: in production each gym is reached at
`<subdomain>.dsmhgroup.com`, an edge layer (`proxy.ts`) resolves that subdomain
to a tenant UUID and injects an `x-tenant-id` header, and auth cookies are shared
across `*.dsmhgroup.com`.

None of that exists on `localhost`, so a few small, **development-only** shims
make the same flow work locally. They are all gated on
`process.env.NODE_ENV === "development"` and change nothing in production.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the secrets
npm run dev
```

Pull `DATABASE_URL` (the public proxy URL), `BETTER_AUTH_SECRET`, and
`INTERNAL_API_SECRET` from Railway. The database is the shared **staging**
Postgres — local dev connects to it on purpose so testing is centralized.

## Accessing a tenant

Use the tenant **subdomain** on `localhost` (browsers resolve `*.localhost`
to 127.0.0.1 automatically — no hosts-file edit needed):

```
http://test.localhost:3000/login     # log in HERE (cookies are host-scoped in dev)
http://test.localhost:3000/console   # admin
http://test.localhost:3000/log       # staff workout log
```

Note: the access subdomain is the tenant's `domain` field (e.g. `test`), not its
`slug`. Plain `http://localhost:3000` is the core platform (login, dashboard).

## What the dev-only shims do

| File | Change | Why |
|------|--------|-----|
| `proxy.ts` | Map `*.localhost` / `*.dsmhgroup.local` to the public `*.dsmhgroup.com` domain when calling `/meta/resolve` | The local hostname isn't a resolvable public domain, so tenant resolution would 400 |
| `app/api/be/[...path]/route.ts` + `lib/api.ts` | Route client→backend calls through a same-origin BFF proxy in dev | The backend's CORS allow-list excludes `*.localhost`; the proxy forwards server-side with no `Origin` header |
| `lib/auth-client.ts` | Use the current origin for the auth client in dev | Cookies are host-scoped per tenant host locally; a fixed base URL would hit the wrong host (sign-out / get-session no-op) |
| `lib/auth.ts` | Relax cookie flags in dev; only register Keycloak/Google when their env vars are set | `secure` + `.dsmhgroup.com` cookies are dropped on `http://localhost`; Keycloak is optional locally |

## Notes

- Email/password auth is enabled — register or sign in at
  `http://test.localhost:3000/login`. Keycloak is optional (and its service may
  be offline); leave the `KEYCLOAK_*` vars unset to skip it.
- Never run `prisma db push` / `drizzle-kit push` / migrations against the shared
  staging database.
