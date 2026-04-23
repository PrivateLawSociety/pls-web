# pls-web

The public face of the **Private Law Society (PLS)** — a bilingual SvelteKit site that introduces the project, hosts the manifesto, and points visitors at the PLS apps.

[**[🇧🇷] Versão em português: LEIAME.md**](LEIAME.md)

---

## What this repo is

`pls-web` is the marketing shell for PLS. It ships:

- a landing page in **English** (`/`) and **Portuguese** (`/pt`)
- the **manifesto** viewer at `/manifesto` and `/pt/manifesto`, embedding the EN/PT PDFs
- a shared header that links out to the two PLS apps deployed separately:
  - **Bitcoin Justice Protocol (BJP)** → <https://pls-bjp.vercel.app>
  - **Web of Trust (WoT)** → <https://pls-wot.vercel.app>

The BJP and WoT apps are **not** served from this repository today. The `src/lib/` tree already carries shared Bitcoin / Nostr / contract helpers in anticipation of bringing those apps in-repo, but only the marketing pages are routed.

## About PLS and BJP

The **Private Law Society** is a project exploring decentralized, post-state justice. Its flagship protocol, the **Bitcoin Justice Protocol (BJP)**, lets two parties form a contract with enforceable terms by locking Bitcoin (or Liquid) as collateral into a multisig controlled by both parties plus one or more agreed arbitrators.

Collateral can be released when either:

1. **Both parties agree** (the happy path — no arbitrator needed), or
2. **One party plus the arbitrator(s) agree** (dispute resolution).

Arbitrators can financially penalize the party in breach but cannot walk off with the funds on their own. Bitcoin provides the trustless settlement layer; Nostr carries signing and contract exchange off-chain. Read the **manifesto** at `/manifesto` for the full rationale.

A companion **Web of Trust** layer (Nostr-based ratings and graph analysis) gives participants portable reputation so arbitrators can be chosen on evidence instead of authority.

## Tech stack

- **SvelteKit 2** on **Svelte 5** with **Vite 7**
- **Tailwind CSS v4** (config in CSS via `@theme`) + some **Flowbite-Svelte** components
- **TypeScript** end-to-end, `svelte-check` for type checking
- **Prettier** for formatting (no ESLint)
- Deploys to **Vercel** via `@sveltejs/adapter-vercel` on the `nodejs22.x` runtime
- Crypto groundwork (for future BJP/WoT in-repo flows): `bitcoinjs-lib`, `liquidjs-lib`, `@vulpemventures/secp256k1-zkp`, `tiny-secp256k1`, `nostr-tools`, plus `vite-plugin-wasm` / `vite-plugin-top-level-await` / `vite-plugin-node-polyfills` to make them run in the browser

## Getting started

Requires **Node.js 22+** (see `.tool-versions`) and **pnpm**.

```bash
pnpm install
pnpm run dev -- --open
```

The dev server runs on <http://localhost:5173> by default.

### Other scripts

| Command | What it does |
| --- | --- |
| `pnpm run dev` | Start the Vite dev server |
| `pnpm run build` | Build the production bundle |
| `pnpm run preview` | Serve the production build locally |
| `pnpm run check` | `svelte-kit sync` + `svelte-check` (type check) |
| `pnpm run check:watch` | Same, in watch mode |
| `pnpm run lint` | Prettier check |
| `pnpm run format` | Prettier write |

## Project layout

```
src/
├── app.css               Tailwind v4 + @theme tokens
├── app.html              HTML shell
├── lib/
│   ├── auth.ts           SSR-safe Nostr auth store
│   ├── bitcoin.ts        bitcoinjs-lib wrappers (BJP groundwork)
│   ├── components/       Shared UI (Button, Card, Badge, ThemeToggle, …)
│   ├── i18n/site.ts      EN ↔ PT route mirror helpers
│   ├── mempool.ts        mempool.space client
│   ├── nostr.ts          Nostr pool + helpers
│   ├── pls/contract.ts   Contract parse / sign / verify
│   ├── stores.ts         Svelte stores (profile cache, contract state)
│   ├── theme.ts          Light/dark theme store
│   ├── utils.ts
│   └── wot/              Web-of-Trust graph logic
├── pls-lib-ambient.d.ts  Types for the pls-lib aliases
└── routes/
    ├── +layout.svelte    Global header, nav, language & theme toggles
    ├── +layout.ts        prerender = true, ssr = true
    ├── +page.svelte      English landing page
    ├── manifesto/+page.svelte
    ├── pt/+page.svelte
    └── pt/manifesto/+page.svelte
static/                   favicon, logo, hero image, team avatars
```

### Internationalization

English is the default. Portuguese routes mirror English routes under `/pt`. The language toggle in the header uses `getTopLevelLocalizedPath` in `src/lib/i18n/site.ts` — **when you add a new localized page, also add its path to the `localizedPaths` set in that file** so the toggle can cross-link it.

### pls-lib aliases

Contract and multisig logic lives in [`pls-lib`](https://github.com/PrivateLawSociety/pls-lib). Its subpackages are aliased in `vite.config.ts` (not `svelte.config.js`) so that SvelteKit does not emit tsconfig `paths` — that would make `svelte-check` follow third-party `.ts` sources. The ambient declarations in `src/pls-lib-ambient.d.ts` type these imports as `any` for the compiler:

- `pls-bitcoin` — Bitcoin (Taproot) multisig helpers
- `pls-liquid` — Liquid multisig helpers
- `pls-core` — shared primitives (`hashFromJSON`, schemas)
- `pls-full` — combined types/schemas
- `pls-nostr` — Nostr helpers

## Deployment

`@sveltejs/adapter-vercel` targets `nodejs22.x`. Pushes to `main` deploy via the connected Vercel project. All current routes are prerendered at build time.

`svelte.config.js` installs a `prerender.handleHttpError` hook that swallows 404s under `/bjp` and `/wot` during crawl — those sections may be added later as client-only subtrees, and in the meantime the header links out to their external deployments.

## Contributing

Run `pnpm run format` before sending a PR and make sure `pnpm run check` passes. For new UI, lean on the CSS custom properties (`rgb(var(--bg))`, `rgb(var(--surface-2))`, `rgb(var(--text))`, `rgb(var(--border))`) and the `pls-blue-400` Tailwind token instead of hardcoded colors.

## Links

- Hosted MVP (BJP): <https://pls-bjp.vercel.app>
- Web of Trust: <https://pls-wot.vercel.app>
- Discord: <https://discord.gg/PNE3PZTUNz>
- YouTube: <https://www.youtube.com/@privatelawsociety>
- X: <https://x.com/PrivateLawSoc>
- Nostr: <https://njump.me/npub1p79dx59d5gctllar73cqnucqft89gpkfmydxj4mmk2jj69s7hn3sfjatxx>
- Podcast episode (PT-BR): <https://www.youtube.com/watch?v=NGx7h9kpPE8>
- Wiki: <https://github.com/PrivateLawSociety/pls-mvp/wiki>
