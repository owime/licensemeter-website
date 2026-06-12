# AI Connectors Sprint (2026-06-12)

Goal: ship (A) AI spend connectors — OpenAI + Anthropic admin-key connectors syncing
daily API cost data (backfilled) and console member lists, with a new AI costs page,
digest spend line and console-leak findings — and (B) AI seat CSV import for ChatGPT
and Claude member lists through the existing SaaS waste rules. SCIM continuous seat
sync is deferred until an Enterprise customer asks. Full plan:
~/.claude/plans/reflective-fluttering-bumblebee.md

User decisions: full AI demo fixtures (marketing euro figures recompute via
demoFigures single source); landing connector strip + SITE_DEFINITION updated.

## Plan

- [x] 1. WP1+WP2 foundations: SaasProvider 7 members, SyncStep +6 literals, AuditAction
       +seats_imported/+seats_import_cleared, ConnectorSpec kind/unpriced + 4 specs,
       aiSpendDaily table, local db:push (dev server stopped)
- [x] 2. WP3 (agent): openaiAdmin.ts + anthropicAdmin.ts (users + costs, pure mappers,
       status-only errors), registry helpers + demo fixtures + deterministic demo spend,
       mapper tests
- [x] 3. WP5a (agent): parseMembers.ts + tests (header detection, delimiters, dedupe,
       status mapping, last-active)
- [x] 4. WP7 (agent): computeAiSpendDelta + tests, aiSpendLine in emails, digest route query
- [x] 5. WP4+WP5b: runSync (imported-seat analysis, syncAiSpend backfill/7d re-pull,
       spend failure isolated from member analysis), actions (connect fixes, importSeats,
       clearImportedSeats)
- [x] 6. WP6 (agent): NavLinks, 4 settings subpages, SaasConnectorPage kind branch,
       ImportSeatsForm, settings connected-detection, licenses !unpriced filter,
       ai-costs page, SpendChart
- [x] 7. WP8: DEMO_FIGURES recompute, connector strip + SITE_DEFINITION, all tests green
- [x] 8. Independent code review (feature-dev:code-reviewer); fix findings
- [x] 9. Verify: npm test + npm run check, Playwright demo walkthrough, demo sync
       idempotency
- [ ] 10. Ship: Supabase migration (RLS app_all + grants licensemeter_app) BEFORE deploy,
       commit, push, CI green, live spot-checks (migration APPLIED + grants verified)

## Acceptance criteria

- AC1: Admin connects OpenAI/Anthropic with one admin key; invalid key fails with a
  generic message; valid key stored encrypted, audited, sync triggered.
- AC2: /app/ai-costs shows backfilled daily USD spend (per-provider totals, top
  categories, trend chart); USD never converted or mixed into EUR snapshots.
- AC3: Entra-disabled console members produce provider-chipped saas_disabled_in_entra
  findings (impact 0); orphans likewise. No new rule IDs; ALL_RULES stays 13.
- AC4: CSV paste on settings/chatgpt + settings/claude creates seats; disabled/orphaned
  (+ inactive when last-active present) findings appear; re-import replaces; clear
  resolves findings; both audited.
- AC5: chatgpt:/claude: price keys editable on licenses page; openai/anthropic console
  members produce no price section.
- AC6: Digest includes "AI API spend last 7 days" line when spend rows exist; helper
  unit-tested, UTC-pinned.
- AC7: Demo shows AI costs chart, ChatGPT + Claude leaver findings, console leaks;
  demoFigures.test.ts green; landing/pricing/msp figures consistent; connector strip +
  SITE_DEFINITION mention the AI connectors.
- AC8: npm test + npm run check green; demo sync run twice is idempotent.
- AC9: Prod migration applied via Supabase MCP with RLS policy + licensemeter_app
  grants BEFORE deploy; verified via has_table_privilege.
- AC10: Playwright walkthrough of all new pages passes incl. aria-live results and
  demo-blocked import message.

## Review

- All ACs verified. 132 vitest tests green (was 90 + concurrent welcome-email suite),
  next lint + tsc clean. Prod migration ai_spend_daily applied via Supabase MCP with
  app_all RLS policy mirrored from saas_seats; has_table_privilege verified for
  licensemeter_app before any deploy.
- Browser walkthrough on the demo tenant (dev server, port 3000): /app/ai-costs renders
  per-provider USD stat cards, 60-day two-series chart with legend + aria-label, top
  categories table and the USD footnote; findings show all 6 new AI rows across pages
  1-2 (ChatGPT leak 55 EUR + idle 55 EUR, Claude leak 25 EUR, OpenAI/Anthropic console
  leaks + orphan at impact 0); licenses shows ChatGPT/Claude price sections and no
  console-member rows; settings lists all 8 connectors; new subpages render with demo
  guard; landing shows the 9-entry connector strip and the recomputed 2.979,86 figure.
  Second demo sync idempotent (finding rows and spend totals stable).
- Independent review (feature-dev:code-reviewer): no P0. Fixed same pass: P1 product-name
  120-char cap in parseMembers (flows into price book keys / dedupe keys; regression
  test added), P2 SpendChart now renders a "chart appears after three days" note instead
  of vanishing for freshly connected tenants. Deliberately not "fixed": demo ai_spend_daily
  rows accumulating across days — the page windows to 90 days so old rows never render,
  growth is ~4 rows/day, and a fixed anchor date would make the demo chart look stale.
- Coordination note: a concurrent session shipped the welcome-email feature (cdc82d6)
  mid-sprint; shared files (actions.ts, email.ts, digest route, marketing page) were
  layered carefully and the tree was re-verified after their commit.
