import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, Users, LineChart, FileCheck2, ShieldCheck, Building2, ArrowLeftRight } from "lucide-react";

const nav = [
  { to: "/parceiro", label: "Visão geral", shortLabel: "Visão", icon: LayoutDashboard },
  { to: "/parceiro/promotores", label: "Promotores", shortLabel: "Rede", icon: Users },
  { to: "/parceiro/depositos", label: "Depósitos", shortLabel: "Depósitos", icon: LineChart },
  { to: "/parceiro/pagamentos", label: "Pagamentos", shortLabel: "Pagar", icon: FileCheck2 },
] as const;

export function PartnerShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/parceiro" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background">
              <Building2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold tracking-tight">PalazeHub <span className="text-muted-foreground">/ Parceiros</span></div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Portal da operadora</div>
            </div>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface/50 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
              <span className="text-xs text-muted-foreground">Conta verificada · <span className="text-foreground">BetSul</span></span>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary/20 text-sm font-semibold text-secondary">
              BS
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-5 pt-6 md:px-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-surface text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-6 rounded-xl border border-border/60 bg-surface/40 p-3.5 text-xs text-muted-foreground">
              Precisa de ajuda com repasses ou contratos? <a href="mailto:parceiros@palazehub.com" className="text-secondary hover:underline">parceiros@palazehub.com</a>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
