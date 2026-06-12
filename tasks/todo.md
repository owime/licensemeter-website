# Connector Setup Guides (2026-06-12, follow-on)

Goal: public step-by-step setup guides for all 8 connectors (Adobe, Zoom, Atlassian,
Salesforce, OpenAI, Anthropic, ChatGPT, Claude) with verified official vendor doc
links, served as static marketing pages and cross-linked from the settings subpages.
Approved scope from chat: guide registry as single source, /connectors/<slug> +
index, SEO surface, link rot resilience (copy self-sufficient, stable vendor URLs).

## Plan

- [x] 1. Verify every vendor doc URL resolves to the right live page (WebFetch)
- [x] 2. src/lib/connectorGuides.ts: slug, vendor, tagline, credential steps
       (title/body/optional verified docUrl), reads[], neverReads[], settingsPath;
       Adobe included even though it predates the CONNECTORS spec array
- [x] 3. Routes: src/app/(marketing)/connectors/page.tsx (index) +
       connectors/[slug]/page.tsx (generateStaticParams, generateMetadata,
       Breadcrumb JSON-LD, connect CTA); marketing tree stays static — no
       cookies()/auth()
- [x] 4. Cross-links: SaasConnectorPage + Adobe settings page "Full setup guide";
       landing connector strip entries link to their guide; footer Connectors
       link; sitemap.ts entries
- [x] 5. Gates: vitest + npm run check green; dev-server render check of all 9 pages
- [x] 6. Reviewer pass on the diff; fixed: detects empty-guard + breadcrumb
       aria-current (no P0; verdict ship)
- [ ] 7. Commit own files only (concurrent session active), push, CI, live checks

## Review

- All 9 routes render locally (index 8 cards; every guide: 3 numbered steps with
  a verified official-doc link, what-it-finds, reads/never-reads split, Breadcrumb
  JSON-LD, target=_blank rel=noopener noreferrer; unknown slug 404s via
  dynamicParams=false). Marketing tree confirmed static by the reviewer (no
  request-time reads). Vendor URLs live-verified: Adobe UMAPI, Zoom S2S OAuth,
  Atlassian org admin API, Salesforce client-credentials setup (search-indexed,
  page is JS-rendered), OpenAI Admin APIs guide, Anthropic Admin API +
  Usage/Cost API, ChatGPT Enterprise members article, Claude members article.

## Acceptance criteria

- AC1: /connectors lists all 8 guides; /connectors/<slug> renders numbered setup
  steps, a what-we-read / never-read split, the read-only + encryption story and a
  connect CTA, for every provider including Adobe.
- AC2: Every external vendor link in the guides was fetched and verified live in
  this session; links open in new tabs with rel="noopener noreferrer".
- AC3: Pages are static (build route table), indexed (sitemap + metadata +
  Breadcrumb JSON-LD), German number convention not applicable (no figures).
- AC4: Each settings connector subpage links to its guide; landing strip entries
  link to guides; no copy forked from connectors.ts specs (guides reference the
  same labels).
- AC5: npm test + npm run check green; all 9 routes return 200 locally and live.

## Review

(filled after evaluation)
