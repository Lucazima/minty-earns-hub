import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, LinkIcon, Receipt, Wallet, Sparkles, Sun, Moon, UserPlus, UserCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";


const nav = [
  { to: "/", label: "Painel", icon: Home },
  { to: "/link", label: "Meu link", icon: LinkIcon },
  { to: "/extrato", label: "Extrato", icon: Receipt },
  { to: "/receber", label: "Receber", icon: Wallet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar (mobile brand + desktop header) */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">PalazeHub</span>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface/50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-primary pulse-mint" />
              <span className="text-xs text-muted-foreground">Você está online</span>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary/20 text-sm font-semibold text-secondary">
              M
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-5 pt-6 md:px-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-52 shrink-0 md:block">
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
                      ? "bg-secondary/15 text-foreground"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-secondary" : ""}`} strokeWidth={2} />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-32">{children}</main>
      </div>

      {/* Mobile bottom nav */}
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
