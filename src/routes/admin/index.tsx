import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminOverview } from "@/lib/admin.functions";
import { CountUp } from "@/components/CountUp";
import { AlertTriangle, TrendingUp, Users, Wallet, Coins, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Visão executiva — PalazeHub Admin" },
      { name: "description", content: "Cockpit da plataforma de afiliados PalazeHub." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const fn = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "overview"], queryFn: () => fn() });

  if (isLoading || !data) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Carregando cockpit…</div>;
  }

  const { kpis, growth, topPerformers, alerts } = data;
  const maxVolume = Math.max(1, ...growth.map((g) => g.volume));
  const maxPromoters = Math.max(1, ...growth.map((g) => g.promoters));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Cockpit</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Visão executiva</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Como a plataforma está performando hoje. Números são atualizados em tempo real.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Promoters ativos" icon={Users} value={kpis.activePromoters} prefix="" decimals={0} />
        <KpiCard label="Turnover no mês" icon={TrendingUp} value={kpis.turnoverMonth} prefix="R$ " decimals={2} accent="mint" />
        <KpiCard label="Comissões pendentes" icon={Coins} value={kpis.commissionsPending} prefix="R$ " decimals={2} />
        <KpiCard label="Payouts aguardando" icon={Wallet} value={kpis.payoutsPending} prefix="R$ " decimals={2} sub={`${kpis.payoutsPendingCount} solicitação(ões)`} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={2.5} />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Alertas</h2>
          </div>
          <ul className="space-y-2">
            {alerts.map((a, i) => (
              <li
                key={i}
                className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-sm ${
                  a.severity === "alert"
                    ? "border-warning/40 bg-warning/10 text-foreground"
                    : a.severity === "warn"
                    ? "border-secondary/30 bg-secondary/10 text-foreground"
                    : "border-border/60 bg-background/60 text-muted-foreground"
                }`}
              >
                <span>{a.message}</span>
                {a.kind === "pending_promoters" && (
                  <Link to="/admin/promoters" search={{ status: "pending" } as never} className="text-xs font-medium text-secondary hover:underline">
                    Revisar →
                  </Link>
                )}
                {a.kind === "old_payouts" && (
                  <Link to="/admin/payouts" className="text-xs font-medium text-secondary hover:underline">
                    Ver fila →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Growth chart */}
      <section className="rounded-2xl border border-border/60 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Crescimento — 30 dias</h2>
            <p className="mt-1 text-xs text-muted-foreground">Volume diário de depósitos e novos promoters.</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Volume</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" /> Novos</span>
          </div>
        </div>
        <svg viewBox="0 0 600 160" className="h-40 w-full">
          {growth.map((g, i) => {
            const x = (i / (growth.length - 1)) * 600;
            const yVol = 150 - (g.volume / maxVolume) * 130;
            return <circle key={i} cx={x} cy={yVol} r="2" className="fill-primary" />;
          })}
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={growth
              .map((g, i) => `${(i / (growth.length - 1)) * 600},${150 - (g.volume / maxVolume) * 130}`)
              .join(" ")}
          />
          <polyline
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="2"
            strokeDasharray="3 3"
            points={growth
              .map((g, i) => `${(i / (growth.length - 1)) * 600},${150 - (g.promoters / maxPromoters) * 130}`)
              .join(" ")}
          />
        </svg>
      </section>

      {/* Top performers */}
      <section className="rounded-2xl border border-border/60 bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Top performers do mês</h2>
          <Link to="/admin/promoters" className="text-xs font-medium text-secondary hover:underline">
            Ver todos <ArrowUpRight className="inline h-3 w-3" />
          </Link>
        </div>
        {topPerformers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem volume registrado neste mês.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {topPerformers.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <Link to="/admin/promoters/$id" params={{ id: p.id }} className="flex items-center gap-3 group">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-background text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>
                    <div className="text-sm font-medium group-hover:text-secondary">{p.name}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.tier}</div>
                  </span>
                </Link>
                <span className="font-display text-sm font-semibold tabular">
                  R$ {p.volume.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  icon: Icon,
  value,
  prefix,
  decimals,
  accent,
  sub,
}: {
  label: string;
  icon: any;
  value: number;
  prefix: string;
  decimals: number;
  accent?: "mint";
  sub?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent === "mint"
          ? "border-primary/30 bg-primary/5 shadow-[0_0_40px_-20px_hsl(var(--primary)/.5)]"
          : "border-border/60 bg-surface"
      }`}
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </div>
      <div className={`mt-3 font-display text-3xl font-bold tabular ${accent === "mint" ? "text-primary" : "text-foreground"}`}>
        <CountUp value={value} prefix={prefix} decimals={decimals} />
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
