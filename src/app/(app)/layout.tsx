import type { ReactNode } from "react";
import { NavLinks } from "@/components/nav-links";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nome = (user?.user_metadata?.nome as string | undefined) ?? user?.email ?? "Usuário";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-4 md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-card">
            BS
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Busca Site</p>
            <p className="text-[11px] text-muted">Licenciamento</p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto border-t border-border pt-3">
          <p className="truncate px-3 pb-1 text-xs text-muted" title={nome}>
            {nome}
          </p>
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
