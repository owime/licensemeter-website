# GA pass: Beta labels out, em dashes out, full product review (2026-06-12)

Goal: (1) remove every Beta/beta label so all connectors present as GA,
(2) remove all em dashes from texts and rewrite them warm and human (no
mechanical hyphen swaps in user-facing copy), (3) full review of every
feature, page, button, link and text; deliverable is a prioritized list
of fixes and improvements.

## Plan

- [ ] 1. Beta removal (19 hits): Pills in settings/adobe/SaasConnectorPage,
       licenses "(beta)" headers, landing strip tag: "Beta" x8, marketing
       layout footer line, msp page, SITE_DEFINITION in site.ts (hero +
       JSON-LD + llms.txt share it), runSync comments, README
- [ ] 2. Em dash removal: 349 in src/ plus docs/, README, SETUP, one
       workflow file; 4 parallel rewrite agents with disjoint file sets;
       style: comma/period/colon/parens or restructure, tests updated in
       lockstep; en dash in findings/page.tsx normalized too
- [ ] 3. Gates: npm run check + npm test green, zero "—" and zero
       user-facing "beta" greps
- [ ] 4. Full review fan-out (read-only agents): A marketing pages,
       B dashboard app, C server/API/cron, D emails + PDF + exports,
       E live click-through of every link/button (local dev + prod
       link check). Plus: verify prod tenants.monthly_report column
       exists (memory flagged the migration as blocked mid-session)
- [ ] 5. Compile prioritized findings list (fix now / fix soon / ideas)

## Acceptance criteria

- AC1: grep -ri "beta" over src/ has zero user-visible hits (UI strings,
  marketing copy, emails); README/docs no longer call connectors beta
- AC2: grep "—" over src/ docs/ README.md SETUP.md .github returns zero;
  rewritten copy reads natural (no " - " splices in marketing/email copy)
- AC3: npm run check and npm test pass; SITE_DEFINITION still single-source
  (hero = JSON-LD = llms.txt verbatim)
- AC4: review covers every route (marketing, dash, api), every nav/footer
  link, every form/button, emails, PDF, and prod link health; findings
  listed with severity and file refs
- AC5: working tree committed locally; push only after user confirms
  (push auto-deploys prod)

## Review

(filled after evaluation)
