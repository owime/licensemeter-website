import Link from "next/link";

import { NavLinks } from "~/components/workspace/NavLinks";
import { requireAccess } from "~/server/access";
import { signOut } from "~/server/auth";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await requireAccess("viewer");

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar">
        <Link href="/app" className="px-5 pt-6 pb-7">
          <span className="font-display text-lg tracking-tight text-paper">
            License<span className="text-rust">Meter</span>
          </span>
        </Link>

        <div className="border-y border-sidebar-line px-5 py-3">
          <div className="truncate text-sm font-medium text-paper">
            {ctx.tenant.name ?? ctx.tenant.tid}
          </div>
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
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="mt-3 text-xs text-sidebar-soft underline-offset-4 hover:text-paper hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-8 lg:px-12">{children}</main>
    </div>
  );
}
