# Member roles review: follow-up actions (2026-06-18)

Review verdict: keep all three roles (viewer/admin/owner). The model is a clean
read/operate/govern hierarchy (ROLE_RANK in src/server/access.ts), enforcement is
consistent via requireAccess/apiAccess, and Owner's two unique powers (manage
owners, delete workspace) are exactly the irreversible/governance ones - correct
to separate from Admin. No role should be removed.

The actionable gaps are documentation and one missing capability.

## Plan

### P1 - Change a claimed member's role (functional gap)
Today the only member writes are invite / resend / remove. A claimed member's
role cannot be changed at all (addMember bails at actions.ts:280 once oid is set).
This was a deliberate guard ("owner-demotion via re-invite closed"), so the fix is
a NEW guarded action, not loosening addMember.

- [ ] Add `changeMemberRole(membershipId, newRole)` server action in src/server/actions.ts
      - requires apiAccess("admin"); demo workspace blocked; target scoped to tenant
      - granting owner OR changing an existing owner requires caller is owner
        (mirror addMember:263 / removeMember:391)
      - block changing your OWN role (mirror "cannot remove yourself") -> also
        prevents last-owner self-demotion / workspace orphaning
      - no-op if role unchanged; audit("member_role_changed", {email, from, to})
- [ ] UI: role control in the settings member list (extend MemberActions or a
      small RoleSelect) - visible to admins, owner option only when caller is owner,
      hidden for self and in demo
- Acceptance:
  - admin can promote viewer->admin and demote admin->viewer with no remove/re-invite
  - only an owner can set or unset the owner role
  - nobody can change their own role; the last owner cannot be orphaned
  - every change is audit-logged; demo workspace rejects it

### P2 - Document the roles at the point of use (the real weakness)
Only "Viewer (finance)" is hinted in the UI; Admin and Owner are bare words. The
FAQ only really explains Viewer.

- [ ] InviteForm.tsx: one-line plain-language description per role option
      (viewer = read-only dashboards + exports; admin = manage data, settings,
      members, connectors; owner = everything + delete workspace + manage owners)
- [ ] Same descriptions beside the role control in the member list
- [ ] FAQ (src/app/(marketing)/faq/page.tsx:32): expand to spell out Admin vs Owner
- [ ] Optional: short permission matrix in README/docs
- Acceptance: no role option appears as a bare word; FAQ explains all three tiers

### P3 - DB CHECK constraint on role (defense in depth)
role is validated in app code only (schema.ts:75); no DB-level constraint.

- [ ] Drizzle migration: CHECK (role IN ('viewer','admin','owner')) on memberships
- Acceptance: invalid role insert rejected at DB level; existing rows valid; push clean

### Explicitly NOT doing
- Removing any role - decided against; the three tiers are necessary and
  industry-standard (read / operate / govern)

## Gates (per tasks/lessons.md)
- npm run check (lint + tsc), npm test, npm run build all green before pushing
- escape apostrophes as &rsquo; in any (marketing) / JSX copy touched
- verify the member-role UI live in the running app (settings) before calling done
- separate code-reviewer subagent evaluates against the acceptance criteria above

## Review (2026-06-18) - all three shipped

P1 PASS: changeMemberRole added (actions.ts) + RoleSelect in the member list.
  Guards verified by code-reviewer: admin cannot promote-to/demote owner; cannot
  change own role; tenant-scoped lookup; demo blocked; newRole validated; audits
  member_role_changed; same ActionResult shape as siblings.
P2 PASS: shared src/lib/roles.ts (ROLE_LABEL/ROLE_DESCRIPTION/ROLE_ORDER); invite
  dropdown now shows a live per-role description; member Pill carries the
  description as a tooltip; FAQ entry spells out viewer vs admin vs owner.
P3 PASS: check() on memberships.role; constraint proven in an isolated pglite
  (valid roles accepted; "superuser"/"Owner"/""/"guest" rejected). Repo deploys
  via db:push (migration chain already stale from prior push-only changes), so
  schema.ts is the source of truth - did not add to the broken migration chain.
  Lands in prod on the next `npm run db:push`.

Gates: next lint clean, tsc clean, 188/188 tests, production build green.

Reviewer false-positive (NOT applied): claimed last-owner demotion can orphan the
workspace. Disproven - demoting an owner requires being a different owner, so the
actor always remains an owner (same invariant as removeMember). Added a clarifying
doc-comment instead of a dead count-check.

Not browser-verified: the member-role UI sits behind Microsoft sign-in on a
non-demo workspace (the demo hides member management), so it is not reachable from
the preview without real tenant credentials. Covered by types + build + review.
