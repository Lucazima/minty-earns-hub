import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, TrendingUp, Users, Wallet, Sparkles, Share2, Rocket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CountUp } from "@/components/CountUp";
import { loadDashboard, formatTime } from "@/lib/promoterData";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Painel — PalazeHub" },
      { name: "description", content: "Acompanhe seus ganhos em tempo real e veja quem indicou." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: loadDashboard,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 w-40 animate-pulse rounded bg-surface" />
          <div className="hero-card h-56 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="surface-card h-28 animate-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Não deu pra carregar seus dados agora. Tenta atualizar a página.</p>
        </div>
      </AppShell>
    );
  }

  if (data.monthEarnings === 0 && data.referredCount === 0) {
    return <EmptyDashboard name={data.profile.display_name} />;
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="eyebrow">Olá, {data.profile.display_name}</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Bom te ver por aqui.
          </h1>
        </div>

        <section className="hero-card relative p-6 md:p-10">
          <div className="hero-glow" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Seus ganhos neste mês</span>
              {data.monthChangePct !== null && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                    <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                    {data.monthChangePct >= 0 ? "+" : ""}{data.monthChangePct.toFixed(0)}%
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">vs. mês passado</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-primary md:text-7xl">
                R$&nbsp;<CountUp value={data.monthEarnings} />
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              É o quanto você já ganhou compartilhando seu link neste mês. Continue nesse ritmo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/receber"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.98]"
              >
                Receber R$ {data.available.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                to="/link"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
              >
                Compartilhar meu link
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            eyebrow="Pessoas que você indicou"
            value={data.referredCount}
            icon={<Users className="h-4 w-4" strokeWidth={2} />}
            hint={data.referredCount > 0 ? "Continue compartilhando" : "Convide a primeira"}
            prefix=""
            decimals={0}
          />
          <MetricCard
            eyebrow="Elas depositaram"
            value={data.totalDeposited}
            icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}
            hint={data.referredCount > 0 ? `Média R$ ${(data.totalDeposited / data.referredCount).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} por pessoa` : "Aguardando primeiros depósitos"}
            prefix="R$ "
            decimals={0}
          />
          <MetricCard
            eyebrow="Disponível para saque"
            value={data.available}
            icon={<Wallet className="h-4 w-4" strokeWidth={2} />}
            hint="Cai na hora no seu Pix"
            prefix="R$ "
            decimals={2}
            highlight
          />
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="surface-card p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Últimas movimentações</h2>
              <Link to="/extrato" className="text-xs font-medium text-secondary hover:underline">
                Ver tudo
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border/40">
              {data.recent.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  Nada ainda. Vai aparecer aqui assim que rolar.
                </li>
              )}
              {data.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(r.occurred_at)}</p>
                  </div>
                  <span className="font-display shrink-0 text-sm font-semibold tabular text-primary">
                    +R$ {Number(r.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-secondary/30 p-5"
               style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="h-5 w-5 text-primary" strokeWidth={2.5} />
            <h3 className="font-display mt-3 text-lg font-semibold leading-tight">
              Novo aqui? A gente te leva pelo caminho.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Um tour rápido pra você começar a ganhar hoje.
            </p>
            <Link
              to="/onboarding"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-foreground/10 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-foreground/15"
            >
              Começar tour <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({
  eyebrow, value, icon, hint, prefix = "", decimals = 0, highlight = false,
}: {
  eyebrow: string; value: number; icon: React.ReactNode; hint: string;
  prefix?: string; decimals?: number; highlight?: boolean;
}) {
  return (
    <div className={`surface-card p-5 transition ${highlight ? "ring-1 ring-primary/30" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="eyebrow">{eyebrow}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${highlight ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>
          {icon}
        </span>
      </div>
      <div className={`font-display mt-4 text-3xl font-bold tabular ${highlight ? "text-primary" : "text-foreground"}`}>
        <CountUp value={value} prefix={prefix} decimals={decimals} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyDashboard({ name }: { name: string }) {
  const steps = [
    { n: 1, title: "Copie seu link", body: "Ele é só seu — quem entra por ele fica atrelado à sua conta." },
    { n: 2, title: "Compartilhe onde tiver gente", body: "WhatsApp, Instagram, grupos. Um envio já vale." },
    { n: 3, title: "Comece a ganhar", body: "Toda vez que alguém deposita, uma parte é sua. Sem cálculo." },
  ];
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="eyebrow">Bem-vindo, {name}</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Vamos fazer os primeiros ganhos.
          </h1>
        </div>

        <section className="hero-card relative p-6 md:p-10">
          <div className="hero-glow" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" strokeWidth={2.5} />
              <span className="eyebrow !text-primary">Sua jornada começa aqui</span>
            </div>
            <h2 className="font-display mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
              Seus primeiros ganhos<br className="hidden md:block" /> aparecem aqui.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Ainda tá zerado — mas em poucos minutos isso muda. É só compartilhar seu link uma vez pra ver o painel ganhar vida.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/link"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.98]"
              >
                <Share2 className="h-4 w-4" strokeWidth={2.5} />
                Compartilhar meu link
              </Link>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
              >
                Como funciona?
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="surface-card p-5">
              <div className="flex items-center gap-3">
                <span className="font-display grid h-9 w-9 place-items-center rounded-lg bg-secondary/15 text-sm font-bold text-secondary tabular">
                  {s.n}
                </span>
                <h3 className="font-display text-base font-semibold text-foreground">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
