# LicenseMeter interface system

LicenseMeter uses a restrained, operational visual language for IT and finance teams. The interface should feel precise and trustworthy, with enough warmth to avoid reading like an admin-console clone.

## Foundations

- Use semantic color tokens from `src/styles/globals.css`; do not introduce page-local colors.
- Teal is the only primary-action accent. Amber means measurable cost exposure, emerald means healthy or recovered, and red is reserved for errors and destructive actions.
- Geist Sans carries both display and body roles; Geist Mono is limited to identifiers and tabular values.
- Use the 4/8-point spacing rhythm, rounded cards, quiet borders, and the shared elevation scale.
- Light and system dark mode are first-class. Validate contrast and interaction states in both.

## Interaction rules

- Every interactive target is at least 44px tall or has an equivalent expanded hit area.
- Every control has a visible label, keyboard focus, hover/pressed feedback, pending state, and nearby recovery-oriented errors.
- Use links for navigation and buttons for actions. Destructive actions require confirmation and remain visually red.
- Preserve filters, sorting, pagination, and other shareable state in the URL.
- Hide raw IDs, provider keys, and implementation data behind a clearly labeled technical-details disclosure.

## Data presentation

- Lead with the decision: cost, impact, owner, due date, or next action.
- Use locale-aware dates, numbers, and currencies with tabular figures.
- Charts require a text summary, legend, exact-value table, and responsive behavior without horizontal page overflow.
- Empty states explain why the area is empty and provide the most useful next action.
- Demo mode must expose the shape of workflows without allowing persistent mutations.

## Responsive and accessibility baseline

- Test at 320, 375, 768, 1024, and 1440px, including landscape and 200% text zoom.
- No page-level horizontal scrolling. Dense desktop tables become stacked mobile cards.
- Respect reduced motion and system theme preferences.
- Maintain semantic landmarks, sequential headings, skip links, screen-reader status regions, and keyboard-operable disclosures.
