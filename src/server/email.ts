import { env } from "~/env";

/**
 * Outgoing mail via Resend, entirely env-gated: without RESEND_API_KEY and
 * EMAIL_FROM every send is a silent no-op (returns false). No SDK dependency.
 */
export const emailEnabled = (): boolean =>
  Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);

export const sendEmail = async (args: {
  to: string[];
  subject: string;
  html: string;
}): Promise<boolean> => {
  if (!emailEnabled()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: args.to,
      // Tenant display names flow into subjects; strip header-breaking
      // control characters and cap the length.
      subject: args.subject.replace(/[\r\n]+/g, " ").slice(0, 200),
      html: args.html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}`);
  }
  return true;
};

const escapeHtml = (s: string): string =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Workspace invitation: who invited you, where, as what — one click to sign in. */
export const inviteHtml = (args: {
  inviterName: string;
  tenantName: string;
  role: string;
  appUrl: string;
}): string => `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1c1a16">
  <h1 style="font-size:22px;font-weight:normal">
    ${escapeHtml(args.inviterName)} invited you to LicenseMeter
  </h1>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#6b665d;line-height:1.5">
    You have been added to the workspace
    <strong style="color:#1c1a16">${escapeHtml(args.tenantName)}</strong>
    as <strong style="color:#1c1a16">${escapeHtml(args.role)}</strong>.
    LicenseMeter shows which Microsoft 365 licenses the organization pays for
    but nobody uses — with read-only access to license metadata, never content.
  </p>
  <p style="margin:24px 0">
    <a href="${args.appUrl}/api/auth/signin"
       style="font-family:Arial,sans-serif;font-size:14px;background:#1c1a16;color:#faf8f3;padding:12px 20px;text-decoration:none">
      Sign in with Microsoft
    </a>
  </p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#a39d8f;line-height:1.5">
    Use the Microsoft account for this email address. If you did not expect
    this invitation, you can ignore this email — nothing is shared without
    signing in.
  </p>
</div>`;

/**
 * "N new findings since last week (+X/mo). M resolved (Y/mo freed)." — the
 * money figures arrive pre-formatted. Zero-count parts degrade gracefully.
 */
const deltaBlock = (delta: {
  newCount: number;
  newImpact: string;
  resolvedCount: number;
  resolvedImpact: string;
}): string => {
  const fresh =
    delta.newCount > 0
      ? `<strong>${delta.newCount} new finding${delta.newCount === 1 ? "" : "s"} since last week (+${escapeHtml(delta.newImpact)}/mo).</strong>`
      : "No new findings since last week.";
  const resolved =
    delta.resolvedCount > 0
      ? ` ${delta.resolvedCount} resolved (${escapeHtml(delta.resolvedImpact)}/mo freed).`
      : "";
  return `
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#1c1a16;line-height:1.5">
    ${fresh}${resolved}
  </p>`;
};

const renewalBlock = (line: string): string => `
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#1c1a16;line-height:1.5;border-top:1px solid #e7e2d6;padding-top:12px;margin-top:16px">
    ${escapeHtml(line)}
  </p>`;

/** Minimal, inline-styled digest that survives Outlook. Leads with the 7-day delta. */
export const digestHtml = (args: {
  tenantName: string;
  currency: string;
  monthlySpend: string;
  monthlyWaste: string;
  openFindings: number;
  topFindings: { title: string; impact: string }[];
  appUrl: string;
  /** 7-day delta shown above the standing totals. */
  delta?: {
    newCount: number;
    newImpact: string;
    resolvedCount: number;
    resolvedImpact: string;
  };
  /** Pre-composed renewal-window line; omitted when no renewal is near. */
  renewalLine?: string;
}): string => `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1c1a16">
  <h1 style="font-size:22px;font-weight:normal">License waste — ${escapeHtml(args.tenantName)}</h1>
  ${args.delta ? deltaBlock(args.delta) : ""}
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#6b665d">
    Monthly spend ${escapeHtml(args.monthlySpend)} ·
    waste <strong style="color:#a8330d">${escapeHtml(args.monthlyWaste)}</strong> ·
    ${args.openFindings} open findings
  </p>
  <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">
    ${args.topFindings
      .map(
        (f) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #e7e2d6">${escapeHtml(f.title)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e7e2d6;text-align:right;color:#a8330d;white-space:nowrap">${escapeHtml(f.impact)}/mo</td>
    </tr>`,
      )
      .join("")}
  </table>
  ${args.renewalLine ? renewalBlock(args.renewalLine) : ""}
  <p style="font-family:Arial,sans-serif;font-size:13px;margin-top:16px">
    <a href="${args.appUrl}/app/findings" style="color:#1c1a16">Open the findings →</a>
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#a39d8f;margin-top:24px">
    Weekly digest for workspace admins. Manage members in Settings.
  </p>
</div>`;

/**
 * Weekly all-clear: sent instead of going silent when a recently synced
 * tenant has zero open findings — the moment the product proved its value.
 */
export const allClearHtml = (args: {
  tenantName: string;
  /** Findings resolved in the last 7 days; the line is omitted when 0. */
  resolvedCount: number;
  resolvedImpact: string;
  renewalLine?: string;
  appUrl: string;
}): string => `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1c1a16">
  <h1 style="font-size:22px;font-weight:normal">All clear — ${escapeHtml(args.tenantName)}</h1>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#1c1a16;line-height:1.5">
    No open findings. Nothing new leaked this week.
  </p>
  ${
    args.resolvedCount > 0
      ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#6b665d;line-height:1.5">
    ${args.resolvedCount} finding${args.resolvedCount === 1 ? "" : "s"} resolved in the last 7 days (${escapeHtml(args.resolvedImpact)}/mo freed).
  </p>`
      : ""
  }
  ${args.renewalLine ? renewalBlock(args.renewalLine) : ""}
  <p style="font-family:Arial,sans-serif;font-size:13px;margin-top:16px">
    <a href="${args.appUrl}/app/findings" style="color:#1c1a16">Open LicenseMeter →</a>
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#a39d8f;margin-top:24px">
    Weekly digest for workspace admins. Manage members in Settings.
  </p>
</div>`;

/**
 * Immediate alert when a sync inserts new offboarding-leak findings —
 * seats that keep billing after the user was disabled or removed.
 */
export const leakAlertHtml = (args: {
  tenantName: string;
  leakCount: number;
  totalImpact: string;
  /** Up to 10 rows; the remainder is summarized below the table. */
  items: { title: string; impact: string }[];
  appUrl: string;
}): string => `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1c1a16">
  <h1 style="font-size:22px;font-weight:normal">New offboarding leaks — ${escapeHtml(args.tenantName)}</h1>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#6b665d;line-height:1.5">
    The last sync found ${args.leakCount} seat${args.leakCount === 1 ? "" : "s"} still paid for
    after the user was disabled or removed —
    <strong style="color:#a8330d">${escapeHtml(args.totalImpact)}/mo</strong> until reclaimed.
  </p>
  <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">
    ${args.items
      .map(
        (f) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #e7e2d6">${escapeHtml(f.title)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e7e2d6;text-align:right;color:#a8330d;white-space:nowrap">${escapeHtml(f.impact)}/mo</td>
    </tr>`,
      )
      .join("")}
  </table>
  ${
    args.leakCount > args.items.length
      ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#6b665d">
    And ${args.leakCount - args.items.length} more in the app.
  </p>`
      : ""
  }
  <p style="font-family:Arial,sans-serif;font-size:13px;margin-top:16px">
    <a href="${args.appUrl}/app/findings" style="color:#1c1a16">Open the findings →</a>
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#a39d8f;margin-top:24px">
    Immediate alert for new offboarding leaks. Turn these off in Settings.
  </p>
</div>`;
