# Private Law Society website

Public website for [Private Law Society](https://privatelawsociety.net/). The four existing pages are rebuilt as a lightweight static site, with a small Cloudflare Pages Function for newsletter signups.

## Run and contribute

- Requires Node.js 20 or newer. No packages need to be installed.
- `npm run build` generates `dist/` with `/`, `/bjp/`, `/wot/` and `/manifesto/`.
- `npm test` checks the newsletter endpoint with mocked requests (no live contacts are added).
- Edit page content and links in `build.mjs`; edit presentation in `assets/style.css` and interaction in `assets/site.js`.
- Open a pull request with a short description and a screenshot or preview for visual changes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Deploy on Cloudflare Pages

1. Connect this GitHub repository to a new Cloudflare Pages project; choose **main** as production branch, `npm run build` as build command and `dist` as output directory. Build works without package installation.
2. In Resend create a separate API key with **Full access** (a Sending access key cannot manage contacts). In Cloudflare Pages **Settings → Variables and Secrets**, add it as the secret `RESEND_API_KEY`; add `PLS_RESEND_SEGMENT_ID` with the ID of a **PLS-only** segment created in Resend. Set them for production and preview if you intend to test signups on preview. Never put these values in the repository.
3. Create a Cloudflare KV namespace for signup limits. In **Settings → Bindings**, bind it under the exact name `PLS_SIGNUP_RATE_LIMIT` for production and preview. Deploy again after changing bindings.
4. Check all four pages at the `pages.dev` address. Submit a test email and check that the contact appears in the PLS segment in Resend. Remove that test contact afterward.
5. Before changing `privatelawsociety.net` DNS, export the existing Hostinger **Subscribe form** registrations: Website Builder → editor → **… → Form submissions → View → Export CSV**. Import the CSV into the **same PLS segment** using Resend Contacts → Import, reviewing the columns and preserving unsubscribed status if present. Keep the CSV private; never commit subscribers to GitHub. Repeat export immediately before switching DNS if new registrations arrived.
6. Verify current DNS records for `privatelawsociety.net` first (especially any email MX/TXT and the `bjp` and `wot` subdomains). Add both `privatelawsociety.net` and `www.privatelawsociety.net` to Pages custom domains, then update only the DNS records needed for the website. Verify old page URLs, PDF links, application subdomains and subscription on the final domain. Only then cancel the old hosting if it is no longer needed for either website or other services.

The form deliberately responds with an error if Resend or KV is not configured. It does **not** pretend to save a subscriber without those services. Broadcasts should be sent via Resend's marketing interface so unsubscribes are honored. Domain verification in Resend may be required before sending from `privatelawsociety.net`; follow the exact DNS records shown in that account, and leave existing mail records intact.

## Source and publishing

The site content and imagery are from the existing PLS website. This repository does not yet grant a reuse license; maintainers can choose one when the project's licensing policy is agreed. Contributions can be proposed through GitHub issues and pull requests.
