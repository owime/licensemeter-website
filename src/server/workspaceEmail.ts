import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { siteUrl } from "~/env";
import { workspaceLabel } from "~/lib/format";
import { db } from "~/server/db";
import { memberships, type TenantRow } from "~/server/db/schema";
import { SUPPORT_EMAIL } from "~/lib/support";
import { emailEnabled, sendEmail, workspaceDeletedHtml } from "~/server/email";
type Tenant = TenantRow;
export const workspaceAdminEmails = (tenantId: string): Promise<string[]> =>
  recipients(tenantId);
const recipients = async (tenantId: string): Promise<string[]> => {
  const rows = await db.query.memberships.findMany({
    where: and(
      eq(memberships.tenantId, tenantId),
      inArray(memberships.role, ["owner", "admin"]),
      // Claimed via either provider (entra oid / workos workosUserId); pending
      // invites have neither and are excluded.
      or(isNotNull(memberships.oid), isNotNull(memberships.workosUserId)),
    ),
    columns: { email: true },
  });
  return rows.map((r) => r.email).filter(Boolean);
};

export const sendWorkspaceDeleted = async (
  tenant: Tenant,
  actor: string,
  to: string[],
): Promise<boolean> => {
  if (!emailEnabled() || to.length === 0) return false;
  const name = workspaceLabel(tenant);
  return sendEmail({
    to,
    replyTo: SUPPORT_EMAIL,
    subject: `Workspace deleted: ${name}`,
    html: workspaceDeletedHtml({ tenantName: name, actor, appUrl: siteUrl() }),
  });
};
