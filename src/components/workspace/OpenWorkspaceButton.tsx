"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "~/components/ui";
import { switchWorkspace } from "~/server/actions";

export const OpenWorkspaceButton = ({
  tenantId,
  name,
}: {
  tenantId: string;
  name: string;
}) => {
  const t = useTranslations("dashLayout.openWorkspace");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="micro"
      disabled={pending}
      aria-label={t("ariaLabel", { name })}
      onClick={() =>
        startTransition(async () => {
          await switchWorkspace(tenantId);
          router.push("/app");
          router.refresh();
        })
      }
    >
      {pending ? "…" : t("open")}
    </Button>
  );
};
