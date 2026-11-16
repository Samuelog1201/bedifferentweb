# Architecture

- `src/app`: Next.js App Router pages and route handlers.
- `src/components`: shared public and administrative UI.
- `src/lib/supabase`: request-scoped server client, browser client, and database types.
- `src/lib/data`: server-only data access and DTOs. Product photography is delivered through short-lived signed URLs.
- `src/lib/validation`: Zod schemas.
- `supabase/migrations`: versioned schema migrations.
- `public/fonts`: licensed brand fonts when supplied.

Server Components are the default. Client Components are limited to interactive UI. Administrative mutations re-check authorization on every invocation. Supabase RLS independently protects database and Storage operations. The product media bucket is private; public signed reads are allowed only for images linked to published products. Public browsing requires no account; the administrator allowlist stays in a private schema and is checked through a restricted helper. Never add service-role credentials to client code.
