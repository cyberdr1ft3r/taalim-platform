# Storage

Feature code depends on `StorageProvider`:

- `put` writes bytes and returns a server-owned key
- `get` returns a `ReadableStream`
- `delete` removes the object
- `exists` and `metadata` report presence without exposing a filesystem path
- `createTemporaryAccess` is optional and, for the local provider, returns an HMAC capability token

`getStorageProvider` selects `local` from configuration. Any other value throws. Production storage may later be Supabase Storage, S3-compatible storage, Cloudflare R2, or another approved store by adding a provider module. Callers stay on `@/server/storage`.

## Private object rules

- `put` generates `so_` plus 32 hex characters. Callers cannot choose the key.
- Keys that contain paths, `..`, or any other shape are rejected.
- The local root cannot resolve inside `public/`.
- The provider does not return a permanent public URL.
- `authorizeStoredObjectRead` denies access when the principal is missing, the business relationship is not allowed, or the key is not opaque. Knowing the key is not enough.
- `createAuthorizedTemporaryAccess` calls the provider only after that check. The token is not a download route and is not authorization by itself. There is no public file route in this issue.
- Local tokens expire within an infrastructure cap of 300 seconds. That cap is not a checkout or enrolment hold.

The only filesystem implementation is `src/server/storage/providers/local-filesystem.ts`. ESLint blocks `node:fs`, `@aws-sdk/*`, and `@supabase/*` everywhere else in `src`.
