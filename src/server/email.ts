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
      subject: args.subject,
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

/** Minimal, inline-styled digest that survives Outlook. */
export const digestHtml = (args: {
  tenantName: string;
  currency: string;
  monthlySpend: string;
  monthlyWaste: string;
  openFindings: number;
  topFindings: { title: string; impact: string }[];
  appUrl: string;
}): string => `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1c1a16">
  <h1 style="font-size:22px;font-weight:normal">License waste — ${escapeHtml(args.tenantName)}</h1>
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
  <p style="font-family:Arial,sans-serif;font-size:13px;margin-top:16px">
    <a href="${args.appUrl}/app/findings" style="color:#1c1a16">Open the findings →</a>
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#a39d8f;margin-top:24px">
    Weekly digest for workspace admins. Manage members in Settings.
  </p>
</div>`;
