import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Coins,
  Wallet,
  Building2,
  ShieldCheck,
  LogOut,
  ArrowLeftRight,
  Percent,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/admin", label: "Visão executiva", shortLabel: "Visão", icon: LayoutDashboard, exact: true },
  { to: "/admin/promoters", label: "Promoters", shortLabel: "Promoters", icon: Users },
  { to: "/admin/commissions", label: "Comissões", shortLabel: "Comissões", icon: Coins },
  { to: "/admin/commissions/rates", label: "Taxas por tier", shortLabel: "Taxas", icon: Percent },
  { to: "/admin/payouts", label: "Payouts", shortLabel: "Payouts", icon: Wallet },
  { to: "/admin/partners", label: "Parceiros BET", shortLabel: "Parceiros", icon: Building2 },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold tracking-tight">
                PalazeHub <span className="text-muted-foreground">/ Admin</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Cockpit da plataforma
              </div>
            </div>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2} />
              Ver como promotor
            </Link>
            <Link
              to="/parceiro"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
              Portal do parceiro
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" strokeWidth={2.5} />
              <span className="text-xs text-secondary-foreground/90">Modo admin</span>
            </div>
            <button
              onClick={signOut}
              aria-label="Sair"
              className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-surface/50 text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-5 pt-6 md:px-8">
        <aside className="hidden w-60 shrink-0 md:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(item.to + "/");
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
                  <Icon className={`h-4 w-4 ${active ? "text-secondary" : ""}`} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-28">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
          {nav
            .filter((n) => n.to !== "/admin/commissions/rates")
            .map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition ${
                    active ? "text-secondary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  {item.shortLabel}
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
