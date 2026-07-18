import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, TrendingUp, Users, Wallet, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CountUp } from "@/components/CountUp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — PalazeHub" },
      { name: "description", content: "Acompanhe seus ganhos em tempo real e veja quem indicou." },
    ],
  }),
  component: Dashboard,
});

const commissionMonth = 2847.5;
const referred = 34;
const deposited = 18420;
const available = 1240.9;

const recent = [
  { name: "João compartilhou seu link", value: 45.0, time: "há 12 min" },
  { name: "Nova indicação depositou R$ 200", value: 30.0, time: "há 1 h" },
  { name: "Comissão diária apurada", value: 128.4, time: "hoje, 09:00" },
];

function Dashboard() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Greeting */}
        <div>
          <p className="eyebrow">Olá, Marina</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Bom te ver por aqui.
          </h1>
        </div>

        {/* Hero earnings card — signature element */}
        <section className="hero-card relative p-6 md:p-10">
          <div className="hero-glow" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Seus ganhos neste mês</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                <TrendingUp className="h-3 w-3" strokeWidth={2.5} /> +18%
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-primary md:text-7xl">
                R$&nbsp;<CountUp value={commissionMonth} />
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              É o quanto você já ganhou compartilhando seu link em novembro. Continue nesse ritmo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/receber"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.98]"
              >
                Receber R$ {available.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

        {/* Metrics */}
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            eyebrow="Pessoas que você indicou"
            value={referred}
            icon={<Users className="h-4 w-4" strokeWidth={2} />}
            hint="+4 esta semana"
            prefix=""
            decimals={0}
          />
          <MetricCard
            eyebrow="Elas depositaram"
            value={deposited}
            icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}
            hint="Média R$ 542 por pessoa"
            prefix="R$ "
            decimals={0}
          />
          <MetricCard
            eyebrow="Disponível para saque"
            value={available}
            icon={<Wallet className="h-4 w-4" strokeWidth={2} />}
            hint="Cai na hora no seu Pix"
            prefix="R$ "
            decimals={2}
            highlight
          />
        </section>

        {/* Activity + tip */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="surface-card p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Últimas movimentações</h2>
              <Link to="/extrato" className="text-xs font-medium text-secondary hover:underline">
                Ver tudo
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border/40">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.time}</p>
                  </div>
                  <span className="font-display shrink-0 text-sm font-semibold tabular text-primary">
                    +R$ {r.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
