# pls-web

O site público da **Private Law Society (PLS)** — uma aplicação SvelteKit bilíngue que apresenta o projeto, hospeda o manifesto e direciona os visitantes para as apps da PLS.

[**[🇺🇸] English version: README.md**](README.md)

---

## O que é este repositório

`pls-web` é o shell institucional da PLS. Ele entrega:

- uma landing page em **inglês** (`/`) e **português** (`/pt`)
- o visualizador do **manifesto** em `/manifesto` e `/pt/manifesto`, com os PDFs EN/PT embutidos
- um cabeçalho que aponta para as duas apps da PLS, hospedadas separadamente:
  - **Bitcoin Justice Protocol (BJP)** → <https://pls-bjp.vercel.app>
  - **Rede de Confiança (WoT)** → <https://pls-wot.vercel.app>

As apps BJP e WoT **não** estão servidas por este repositório hoje. A pasta `src/lib/` já carrega helpers compartilhados de Bitcoin / Nostr / contratos antecipando uma futura incorporação dessas apps, mas só as páginas institucionais estão roteadas.

## Sobre a PLS e o BJP

A **Private Law Society** é um projeto que explora justiça descentralizada e pós-estatal. Seu protocolo principal, o **Bitcoin Justice Protocol (BJP)**, permite que duas partes formem um contrato com termos exequíveis travando Bitcoin (ou Liquid) como colateral em um multisig controlado por ambas as partes e um ou mais árbitros previamente acordados.

O colateral pode ser liberado quando:

1. **As duas partes concordam** (caminho feliz — sem necessidade de árbitro), ou
2. **Uma das partes + o(s) árbitro(s) concordam** (resolução de disputa).

Árbitros podem penalizar financeiramente a parte que descumpriu o acordo, mas não conseguem sair sozinhos com os fundos. O Bitcoin fornece a camada de liquidação sem confiança; o Nostr carrega a assinatura e a troca do contrato off-chain. Leia o **manifesto** em `/pt/manifesto` para a motivação completa.

Uma **Rede de Confiança** (ratings e análise de grafo sobre Nostr) dá aos participantes uma reputação portável, permitindo que árbitros sejam escolhidos com base em evidência — e não em autoridade.

## Stack

- **SvelteKit 2** sobre **Svelte 5** com **Vite 7**
- **Tailwind CSS v4** (configuração em CSS via `@theme`) + alguns componentes do **Flowbite-Svelte**
- **TypeScript** de ponta a ponta, `svelte-check` para verificação de tipos
- **Prettier** como único formatador (sem ESLint)
- Deploy na **Vercel** via `@sveltejs/adapter-vercel` no runtime `nodejs22.x`
- Infraestrutura cripto (para futuros fluxos BJP/WoT dentro do repo): `bitcoinjs-lib`, `liquidjs-lib`, `@vulpemventures/secp256k1-zkp`, `tiny-secp256k1`, `nostr-tools`, além de `vite-plugin-wasm` / `vite-plugin-top-level-await` / `vite-plugin-node-polyfills` para funcionar no navegador

## Começando

Requer **Node.js 22+** (veja `.tool-versions`) e **pnpm**.

```bash
pnpm install
pnpm run dev -- --open
```

O servidor de desenvolvimento sobe em <http://localhost:5173> por padrão.

### Outros scripts

| Comando | O que faz |
| --- | --- |
| `pnpm run dev` | Sobe o Vite em modo dev |
| `pnpm run build` | Gera o bundle de produção |
| `pnpm run preview` | Serve o bundle de produção localmente |
| `pnpm run check` | `svelte-kit sync` + `svelte-check` (checagem de tipos) |
| `pnpm run check:watch` | O mesmo, em modo watch |
| `pnpm run lint` | Prettier em modo check |
| `pnpm run format` | Prettier em modo write |

## Estrutura

```
src/
├── app.css               Tailwind v4 + tokens em @theme
├── app.html              Shell HTML
├── lib/
│   ├── auth.ts           Store de autenticação Nostr seguro para SSR
│   ├── bitcoin.ts        Wrappers de bitcoinjs-lib (base BJP)
│   ├── components/       UI compartilhada (Button, Card, Badge, ThemeToggle, …)
│   ├── i18n/site.ts      Helpers do espelho EN ↔ PT
│   ├── mempool.ts        Cliente mempool.space
│   ├── nostr.ts          Pool Nostr + utilidades
│   ├── pls/contract.ts   Parse / assinatura / verificação de contratos
│   ├── stores.ts         Stores Svelte (cache de perfis, estado de contrato)
│   ├── theme.ts          Store de tema claro/escuro
│   ├── utils.ts
│   └── wot/              Lógica do grafo da Rede de Confiança
├── pls-lib-ambient.d.ts  Tipos para os aliases do pls-lib
└── routes/
    ├── +layout.svelte    Cabeçalho global, nav, toggles de idioma e tema
    ├── +layout.ts        prerender = true, ssr = true
    ├── +page.svelte      Landing page em inglês
    ├── manifesto/+page.svelte
    ├── pt/+page.svelte
    └── pt/manifesto/+page.svelte
static/                   favicon, logo, imagem de hero, avatares do time
```

### Internacionalização

O inglês é o idioma padrão. As rotas em português espelham as rotas em inglês sob `/pt`. O botão de idioma no cabeçalho usa `getTopLevelLocalizedPath` em `src/lib/i18n/site.ts` — **ao adicionar uma nova página localizada, lembre-se de também adicionar o caminho ao conjunto `localizedPaths` nesse arquivo** para que o toggle consiga fazer o link cruzado.

### Aliases do pls-lib

A lógica de contrato e multisig vive no pacote externo [`pls-lib`](https://github.com/PrivateLawSociety/pls-lib). Os subpacotes são aliasados em `vite.config.ts` (e não em `svelte.config.js`) para que o SvelteKit não emita `paths` no tsconfig — isso faria o `svelte-check` seguir arquivos `.ts` de terceiros. As declarações ambientes em `src/pls-lib-ambient.d.ts` tipam esses imports como `any` para o compilador:

- `pls-bitcoin` — multisig Bitcoin (Taproot)
- `pls-liquid` — multisig Liquid
- `pls-core` — primitivos compartilhados (`hashFromJSON`, schemas)
- `pls-full` — tipos/schemas combinados
- `pls-nostr` — helpers Nostr

## Deploy

`@sveltejs/adapter-vercel` com target `nodejs22.x`. Pushes para `main` disparam o deploy pelo projeto conectado na Vercel. Todas as rotas atuais são pré-renderizadas em build.

O `svelte.config.js` instala um `prerender.handleHttpError` que ignora 404s em `/bjp` e `/wot` durante o crawl — essas seções podem ser adicionadas depois como sub-árvores client-only; enquanto isso, o cabeçalho aponta para os deploys externos.

## Contribuindo

Rode `pnpm run format` antes do PR e garanta que `pnpm run check` passa. Para nova UI, prefira as variáveis CSS (`rgb(var(--bg))`, `rgb(var(--surface-2))`, `rgb(var(--text))`, `rgb(var(--border))`) e o token Tailwind `pls-blue-400` em vez de cores hardcoded.

## Links

- MVP hospedado (BJP): <https://pls-bjp.vercel.app>
- Rede de Confiança: <https://pls-wot.vercel.app>
- Discord: <https://discord.gg/PNE3PZTUNz>
- YouTube: <https://www.youtube.com/@privatelawsociety>
- X: <https://x.com/PrivateLawSoc>
- Nostr: <https://njump.me/npub1p79dx59d5gctllar73cqnucqft89gpkfmydxj4mmk2jj69s7hn3sfjatxx>
- Episódio de podcast (PT-BR): <https://www.youtube.com/watch?v=NGx7h9kpPE8>
- Wiki: <https://github.com/PrivateLawSociety/pls-mvp/wiki>
