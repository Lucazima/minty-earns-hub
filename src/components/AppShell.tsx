import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, LinkIcon, Receipt, Wallet, Sparkles, Sun, Moon, UserPlus, UserCheck, Building2, LogOut, UserCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";



const nav = [
  { to: "/", label: "Painel", icon: Home },
  { to: "/link", label: "Meu link", icon: LinkIcon },
  { to: "/extrato", label: "Extrato", icon: Receipt },
  { to: "/receber", label: "Receber", icon: Wallet },
  { to: "/minha-conta", label: "Minha conta", icon: UserCircle },
] as const;

function useMyAvatar() {
  return useQuery({
    queryKey: ["me-avatar"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return { name: null as string | null, url: null as string | null };
      const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle();
      const prof = p as { display_name?: string | null; avatar_url?: string | null } | null;
      let url: string | null = null;
      const path = prof?.avatar_url ?? null;
      if (path) {
        if (path.startsWith("http")) url = path;
        else {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
          url = signed?.signedUrl ?? null;
        }
      }
      return { name: prof?.display_name ?? user.email ?? null, url };
    },
    staleTime: 60_000,
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, toggleTheme, isNewPromoter, setIsNewPromoter } = useApp();
  const { data: me } = useMyAvatar();
  const initials = (me?.name ?? "?")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }


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
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-surface/50 px-3 py-1.5 md:flex">
              <div className="h-2 w-2 rounded-full bg-primary pulse-mint" />
              <span className="text-xs text-muted-foreground">Você está online</span>
            </div>
            <button
              onClick={() => setIsNewPromoter(!isNewPromoter)}
              title={isNewPromoter ? "Ver como promotor com histórico" : "Ver como novo promotor"}
              aria-label="Alternar demo de novo promotor"
              className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-surface/50 text-muted-foreground transition hover:text-foreground"
            >
              {isNewPromoter ? <UserPlus className="h-4 w-4" strokeWidth={2} /> : <UserCheck className="h-4 w-4" strokeWidth={2} />}
            </button>
            <Link
              to="/parceiro"
              title="Portal da operadora"
              className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-surface/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
            >
              <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
              Portal da operadora
            </Link>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-surface/50 text-muted-foreground transition hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
            </button>
            <button
              onClick={signOut}
              aria-label="Sair"
              title="Sair"
              className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-surface/50 text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </button>
            <Link to="/minha-conta" aria-label="Minha conta" title="Minha conta" className="hidden h-9 w-9 overflow-hidden rounded-full border border-border/60 bg-secondary/20 md:block">
              {me?.url ? (
                <img src={me.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-sm font-semibold text-secondary">{initials}</span>
              )}
            </Link>
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
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
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
