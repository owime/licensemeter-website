"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui";
import { updateFindingWorkflow, type ActionResult } from "~/server/actions";
import type { RemediationStatus } from "~/server/types";

type MemberOption = { id: string; label: string };

export const FindingWorkflowForm = ({
  findingId,
  initial,
  members,
}: {
  findingId: string;
  initial: {
    remediationStatus: RemediationStatus;
    assigneeMembershipId: string | null;
    dueDate: string | null;
    workflowNote: string | null;
    ticketUrl: string | null;
  };
  members: MemberOption[];
}) => {
  const [result, action, pending] = useActionState(
    async (_previous: ActionResult | null, formData: FormData) =>
      updateFindingWorkflow(findingId, formData),
    null,
  );
  const t = useTranslations("findings.workflowForm");
  const tw = useTranslations("findings.workflow");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("remediationStatusLabel")}
          <select
            name="remediationStatus"
            defaultValue={initial.remediationStatus}
            autoComplete="off"
            className="border-line bg-card min-h-11 border px-3 py-2 font-normal"
          >
            <option value="unassigned">{tw("unassigned")}</option>
            <option value="planned">{tw("planned")}</option>
            <option value="requested">{tw("requestedFull")}</option>
            <option value="in_progress">{tw("inProgress")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("assigneeLabel")}
          <select
            name="assigneeMembershipId"
            defaultValue={initial.assigneeMembershipId ?? ""}
            autoComplete="off"
            className="border-line bg-card min-h-11 border px-3 py-2 font-normal"
          >
            <option value="">{t("assigneeUnassigned")}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("dueDateLabel")}
          <input
            type="date"
            name="dueDate"
            defaultValue={initial.dueDate ?? ""}
            autoComplete="off"
            className="border-line bg-card min-h-11 border px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("ticketUrlLabel")}
          <input
            type="url"
            name="ticketUrl"
            defaultValue={initial.ticketUrl ?? ""}
            autoComplete="off"
            spellCheck={false}
            placeholder={t("ticketUrlPlaceholder")}
            className="border-line bg-card min-h-11 border px-3 py-2 font-normal"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("notesLabel")}
        <textarea
          name="workflowNote"
          defaultValue={initial.workflowNote ?? ""}
          autoComplete="off"
          rows={4}
          maxLength={2_000}
          placeholder={t("notesPlaceholder")}
          className="border-line bg-card border px-3 py-2 font-normal"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={pending}>
          {pending ? t("saving") : t("saveButton")}
        </Button>
        <p
          role="status"
          aria-live="polite"
          className={
            result
              ? `text-xs ${result.ok ? "text-moss" : "text-danger-text"}`
              : "sr-only"
          }
        >
          {result
            ? result.ok
              ? t("saved")
              : (result.error ?? t("genericError"))
            : t("noChanges")}
        </p>
      </div>
    </form>
  );
};
