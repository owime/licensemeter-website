import Link from "next/link";

/**
 * The three button tiers of the design system. Primary and secondary are
 * sentence case; micro is the uppercase 11px tier for table-row actions:
 * visually ~26px tall, with an invisible ::after overlay stretching the hit
 * area to 44px for touch without disturbing table-row layouts.
 */
const BUTTON_VARIANTS = {
  primary:
    "inline-flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-2.5 bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-rust-deep disabled:cursor-not-allowed disabled:opacity-40",
  secondary:
    "inline-flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-2 border border-line-strong bg-card px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink disabled:opacity-50",
  micro:
    "relative inline-flex cursor-pointer touch-manipulation items-center border border-line px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase transition after:absolute after:inset-x-0 after:-inset-y-[9px] after:content-[''] hover:border-ink disabled:opacity-30",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export const buttonClass = (variant: ButtonVariant, extra = ""): string =>
  `${BUTTON_VARIANTS[variant]} ${extra}`.trim();

export const Button = ({
  variant = "secondary",
  className = "",
  ...props
}: React.ComponentProps<"button"> & { variant?: ButtonVariant }) => (
  <button className={buttonClass(variant, className)} {...props} />
);

/** Internal navigation button (next/link). */
export const ButtonLink = ({
  variant = "secondary",
  className = "",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant }) => (
  <Link className={buttonClass(variant, className)} {...props} />
);

/** Plain anchor button, for downloads and API-route links. */
export const ButtonAnchor = ({
  variant = "secondary",
  className = "",
  ...props
}: React.ComponentProps<"a"> & { variant?: ButtonVariant }) => (
  <a className={buttonClass(variant, className)} {...props} />
);

/** Bordered card with the uppercase ledger header, used on dashboard pages. */
export const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="border border-line bg-card">
    <div className="border-b border-line px-5 py-3">
      <h2 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
        {title}
      </h2>
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
);

/** Category/status pill tones. Soft fill + dark text from the same ramp. */
const PILL_TONES = {
  rust: "bg-rust-soft text-rust-deep",
  gold: "bg-gold-soft text-gold",
  slate: "bg-slate-soft text-slate-ink",
  plum: "bg-plum-soft text-plum",
  teal: "bg-teal-soft text-teal-ink",
  moss: "bg-moss-soft text-moss",
  /** Neutral outline tier, e.g. acknowledged status. */
  outline: "border border-line-strong text-ink-soft",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export const PILL_BASE =
  "inline-block px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap uppercase";

export const Pill = ({
  tone,
  className = "",
  ...props
}: React.ComponentProps<"span"> & { tone: PillTone }) => (
  <span className={`${PILL_BASE} ${PILL_TONES[tone]} ${className}`} {...props} />
);
