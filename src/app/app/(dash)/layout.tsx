import Link from "next/link";

import { redirect } from "next/navigation";

import { MobileNav } from "~/components/workspace/MobileNav";
import { NavLinks } from "~/components/workspace/NavLinks";
import { WorkspaceSwitcher } from "~/components/workspace/WorkspaceSwitcher";
import { requireAccess } from "~/server/access";
import { clearSessionCookie } from "~/server/auth";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await requireAccess("viewer");
  const tenantName = ctx.tenant.name ?? ctx.tenant.tid;

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <MobileNav
        tenantName={tenantName}
        isDemo={ctx.tenant.isDemo}
        userName={ctx.user.name}
        role={ctx.membership.role}
      />

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar lg:flex">
        <Link href="/app" className="px-5 pt-6 pb-7">
          <span className="font-display text-lg tracking-tight text-paper">
            License<span className="text-rust-bright">Meter</span>
          </span>
        </Link>

        <div className="border-y border-sidebar-line px-5 py-3">
          {ctx.workspaces.length > 1 ? (
            <WorkspaceSwitcher
              workspaces={ctx.workspaces}
              activeId={ctx.tenant.id}
            />
          ) : (
            <div className="truncate text-sm font-medium text-paper">
              {tenantName}
            </div>
          )}
          <div className="mt-0.5 text-[11px] tracking-wider text-sidebar-soft uppercase">
            {ctx.tenant.isDemo ? "Demo workspace" : "Connected tenant"}
          </div>
        </div>

        <div className="mt-4 flex-1">
          <NavLinks />
        </div>

        <div className="border-t border-sidebar-line px-5 py-4">
          <div className="truncate text-sm text-paper">{ctx.user.name}</div>
          <div className="mt-0.5 text-[11px] tracking-wider text-sidebar-soft uppercase">
            {ctx.membership.role}
          </div>
          <form
            action={async () => {
              "use server";
              await clearSessionCookie();
              redirect("/");
            }}
          >
            <button className="mt-3 text-xs text-sidebar-soft underline-offset-4 hover:text-paper hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
        {children}
      </main>
    </div>
  );
}
