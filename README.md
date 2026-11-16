# BeDifferent

Premium Fitness Lifestyle catalog for Colombia, built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase. Public browsing is open; the first release has no customer accounts, cart, or online checkout. Product inquiries go to WhatsApp and Instagram.

## Local setup

1. Install Node.js 22 LTS and npm.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local` and set the Supabase URL, publishable key, administrator email, and (when known) public site URL.
4. Start with `npm run dev`.

Never commit `.env.local` or any service-role/secret key. Product images use a private Supabase Storage bucket; only published product images can be signed for public display. The administrator must be provisioned through Supabase Auth by the project owner. Public Auth sign-up is not implemented.

## First administrator account

The private allowlist already contains `samuelortizguevara@gmail.com`, but the Supabase project does not yet have a matching Auth user. The owner must create that user in the Supabase Dashboard under **Authentication → Users**, set/confirm the password there, and set `ADMIN_EMAIL` to the same address in `.env.local` and the eventual Vercel environment. Do not place the password or a service-role key in this repository. The site has no administrator registration route.

## Commands

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm run build` — production build
- `npm run test:e2e` — desktop and mobile Playwright coverage

## Project references

- [Architecture](./ARCHITECTURE.md)
- [Project status](./PROJECT_STATUS.md)
- [TODO](./TODO.md)
- [Supabase migrations](./supabase/migrations)

Official logo, licensed Karantina Bold and League Gothic font files, and original product photography have not been provided. Add them under `public/` only when the owner supplies the assets and usage rights.
