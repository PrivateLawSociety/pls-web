# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**pls-web** is the public-facing SvelteKit site for the Private Law Society (PLS). It is the marketing shell — bilingual landing page, manifesto viewer, and header that links out to the two separately-deployed PLS apps:

- **BJP** (Bitcoin Justice Protocol) — `https://pls-bjp.vercel.app` — decentralized contracts with Bitcoin/Liquid collateral arbitrated via multisig.
- **WoT** (Web of Trust) — `https://pls-wot.vercel.app` — Nostr-based rating and reputation graph.

This repo does **not** currently host BJP or WoT routes. The `src/lib/` tree already carries a lot of the shared groundwork (bitcoin, nostr, contract, WoT helpers) in anticipation of bringing those apps in-repo later, but until routes under `/bjp` or `/wot` actually land here, those apps live at the external URLs linked from the header nav.

Deployed to Vercel (`@sveltejs/adapter-vercel`, `nodejs22.x`).

## Commands

Package manager is **pnpm** (see `.npmrc`, `pnpm-lock.yaml`).

- `pnpm install` — install deps
- `pnpm run dev` — Vite dev server (append `-- --open` to open browser)
- `pnpm run build` — production build
- `pnpm run preview` — preview the production build
- `pnpm run check` — `svelte-kit sync` + `svelte-check`
- `pnpm run check:watch` — same in watch mode
- `pnpm run lint` — Prettier check
- `pnpm run format` — Prettier write

There is no test runner configured.

## Architecture

### Rendering model

Everything currently in the repo is prerendered at build time. `src/routes/+layout.ts` sets `ssr = true` and `prerender = true`, and that applies to every existing route (`/`, `/pt`, `/manifesto`, `/pt/manifesto`).

`svelte.config.js` also installs a `prerender.handleHttpError` that swallows 404s under `/bjp` and `/wot` during crawl. Those paths don't exist in this repo — the header nav links out to `pls-bjp.vercel.app` / `pls-wot.vercel.app` with `target="_blank"` — but the handler is kept as a safety net for when those sections are added in a later phase. If you add such a route, it must be client-only (`ssr = false`, `prerender = false`) because crypto/key material should never touch the server; put the flag toggle in a section-level `+layout.ts` rather than editing the root one.

### Routes (`src/routes`)

Current file tree:

- `/` — marketing home (EN), and `/pt` — marketing home (PT)
- `/manifesto` and `/pt/manifesto` — manifesto viewer (embeds Google Drive PDFs)
- `+layout.svelte` / `+layout.ts` — global shell: logo, nav, EN/PT toggle, theme toggle, mobile drawer, manifesto link

That is the complete set of routes at the moment.

### i18n (`src/lib/i18n/site.ts`)

Portuguese is served by mirroring the English routes under `/pt`. For each top-level path there is a sibling under `/pt` (e.g. `/manifesto` ↔ `/pt/manifesto`). The nav switcher uses `getLocaleFromPathname` and `getTopLevelLocalizedPath` to cross-link the two trees; `localizedPaths` inside that file is the canonical list — **when you add a new localized page, add its path there** so the language toggle can find it. Today `localizedPaths` contains `/` and `/manifesto`.

### Shared library (`src/lib`)

- `auth.ts` — SSR-safe Nostr auth store. Deliberately avoids bitcoinjs-lib / liquidjs-lib / secp256k1-zkp imports so it can load from the prerendered root layout. Stores private key in `sessionStorage` under `private-key`; reads Nostr kind-0 profile via `SimplePool`.
- `theme.ts` — light/dark theme store, initialized in the root `+layout.svelte` on mount.
- `i18n/site.ts` — locale helpers for the EN/PT mirror.
- `components/` — shared UI (Tailwind + some Flowbite pieces): `Button`, `Card`, `Badge`, `CopyButton`, `SiteFooter`, `ThemeToggle`, `HeaderPerson`, `ProfileAvatar`, etc.
- `bitcoin.ts`, `mempool.ts`, `nostr.ts`, `pls/contract.ts`, `stores.ts`, `utils.ts`, `wot/{index,nostr,rendering}.ts` — BJP/WoT groundwork that isn't wired to any route yet. Leave these alone unless you are actively migrating a BJP or WoT flow into this repo; dragging them into the marketing bundle would pull bitcoinjs-lib / liquidjs-lib into every prerendered page.

### Core dependency: `pls-lib`

Contract/multisig/crypto logic lives in the external `pls-lib` package (`github:PrivateLawSociety/pls-lib`). Aliases to its subpackages are defined in **`vite.config.ts`** (`resolve.alias`), not in `svelte.config.js`. This is deliberate: keeping them out of `kit.alias` prevents svelte-kit from generating tsconfig `paths`, which would otherwise make `svelte-check` follow third-party `.ts` sources we can't fix. Type checking goes through the ambient declarations in `src/pls-lib-ambient.d.ts` (which type these modules as `any`).

Aliases:

- `pls-bitcoin` — Bitcoin multisig (Taproot) helpers
- `pls-liquid` — Liquid multisig helpers
- `pls-core` — shared primitives (`hashFromJSON`, schemas)
- `pls-full` — combined types/schemas (`Contract`, `UnsignedContract`, `contractSchema`, `unsignedContractSchema`)
- `pls-nostr` — Nostr helpers

### Browser crypto / polyfills

`vite.config.ts` pulls in `vite-plugin-wasm`, `vite-plugin-top-level-await`, and `vite-plugin-node-polyfills` specifically so `bitcoinjs-lib`, `liquidjs-lib`, `@vulpemventures/secp256k1-zkp`, and `tiny-secp256k1` can run in the browser when BJP/WoT flows are brought in. `@vulpemventures/secp256k1-zkp` is marked `external` in `rollupOptions`. If you add a new crypto dependency and hit a "Buffer is not defined" / WASM / top-level-await error, extend `optimizeDeps.include` here rather than working around it in app code.

## Stack & conventions

- **Svelte 5** + **SvelteKit 2** + **Vite 7**. Svelte 5 runes (`$state`, `$derived`, `$props`) are available, but most existing components still use Svelte 4-style reactivity (`$:`, `export let`). Match the surrounding file's style when editing; don't mass-migrate.
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js` / `postcss.config.js` — config lives in CSS via `@theme`). Theming uses CSS custom properties like `rgb(var(--bg))`, `rgb(var(--surface-2))`, `rgb(var(--text))`, `rgb(var(--border))`, and the Tailwind color `pls-blue-400`. Stick to these tokens for new UI instead of hardcoding hex.
- **Flowbite-Svelte 1.x** is available if needed — API differs from 0.x; consult component source in `node_modules/flowbite-svelte` when in doubt.
- `tailwind-merge` for merging class lists.
- Prettier is the only formatter/linter (`.prettierrc`). Run `pnpm run format` before committing.
- Keep contract hashing (when/if you bring BJP flows in) routed through `getMinimalUnsignedContract` — never hash a raw object with extra fields.
- Node version is pinned via `.tool-versions`; Vercel runtime is `nodejs22.x`.

## Docs

- `README.md` (English) and `LEIAME.md` (Portuguese) — project overview
- PLS wiki: https://github.com/PrivateLawSociety/pls-mvp/wiki
