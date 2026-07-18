import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Users, TrendingUp, Wallet, ShieldCheck, Activity } from "lucide-react";
import { PartnerShell } from "@/components/PartnerShell";
import { CountUp } from "@/components/CountUp";
import { promoters, brl } from "@/lib/partnerData";

export const Route = createFileRoute("/parceiro")({
  head: () => ({
    meta: [
      { title: "Portal da operadora — PalazeHub" },
      { name: "description", content: "Visão consolidada de promotores, depósitos e repasses da sua operação." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const active = promoters.filter((p) => p.status === "ativo").length;
  const depositsMTD = promoters.reduce((s, p) => s + p.depositsMTD, 0);
  const ngrMTD = promoters.reduce((s, p) => s + p.ngrMTD, 0);
  const commissionDue = promoters.reduce((s, p) => s + p.commissionDue, 0);
  const top = [...promoters].sort((a, b) => b.depositsMTD - a.depositsMTD).slice(0, 5);
  const maxDep = top[0].depositsMTD;

  return (
    <PartnerShell>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Portal da operadora · BetSul</p>
            <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Visão geral · Novembro 2026
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              O que sua rede de promotores gerou este mês e o que está aguardando sua confirmação de repasse.
            </p>
          </div>
          <Link
            to="/parceiro/pagamentos"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
          >
            Confirmar repasse · {brl(commissionDue)}
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </header>

        {/* KPIs */}
        <section className="grid gap-4 md:grid-cols-4">
          <Kpi icon={<Users className="h-4 w-4" strokeWidth={2} />} label="Promotores ativos" value={active} suffix={` de ${promoters.length}`} />
          <Kpi icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />} label="Depósitos gerados (mês)" value={depositsMTD} prefix="R$ " decimals={0} />
          <Kpi icon={<Activity className="h-4 w-4" strokeWidth={2} />} label="NGR atribuído" value={ngrMTD} prefix="R$ " decimals={0} />
          <Kpi icon={<Wallet className="h-4 w-4" strokeWidth={2} />} label="Comissão a repassar" value={commissionDue} prefix="R$ " decimals={2} highlight />
        </section>

        {/* Signature card */}
        <section className="hero-card relative p-6 md:p-8">
          <div className="hero-glow" />
          <div className="relative grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={2.5} />
                <span className="eyebrow !text-primary">Fatura em aberto</span>
              </div>
              <div className="font-display mt-4 text-5xl font-bold text-foreground md:text-6xl">
                R$ <CountUp value={commissionDue} />
              </div>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Comissões apuradas para {promoters.length} promotores em novembro. Confirme os valores para liberar o pagamento na sexta, 21/11.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/parceiro/pagamentos"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  Revisar e aprovar
                </Link>
                <Link
                  to="/parceiro/depositos"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
                >
                  Ver relatório detalhado
                </Link>
              </div>
            </div>

            <ul className="grid gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-4">
              {[
                ["Base de cálculo", brl(ngrMTD)],
                ["Comissão média", "25% do NGR"],
                ["Retenção fiscal", "Emitida pela plataforma"],
                ["Prazo de repasse", "Sexta-feira, 21/11"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between border-b border-border/40 py-2 text-sm last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-foreground">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Top promoters */}
        <section className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Promotores em destaque</h2>
              <p className="text-sm text-muted-foreground">Os que mais geraram depósito este mês.</p>
            </div>
            <Link to="/parceiro/promotores" className="text-xs font-medium text-secondary hover:underline">
              Ver todos ({promoters.length})
            </Link>
          </div>
          <ul className="mt-5 space-y-4">
            {top.map((p, i) => (
              <li key={p.id}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-elevated text-xs font-semibold text-muted-foreground tabular">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.handle} · {p.activePlayers} jogadores ativos</p>
                    </div>
                  </div>
                  <span className="font-display shrink-0 text-sm font-semibold tabular">{brl(p.depositsMTD)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${(p.depositsMTD / maxDep) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PartnerShell>
  );
}

function Kpi({
  icon, label, value, prefix = "", suffix = "", decimals = 0, highlight = false,
}: {
  icon: React.ReactNode; label: string; value: number;
  prefix?: string; suffix?: string; decimals?: number; highlight?: boolean;
}) {
  return (
    <div className={`surface-card p-5 ${highlight ? "ring-1 ring-primary/40" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="eyebrow">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${highlight ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>
          {icon}
        </span>
      </div>
      <div className={`font-display mt-4 text-3xl font-bold tabular ${highlight ? "text-primary" : "text-foreground"}`}>
        <CountUp value={value} prefix={prefix} decimals={decimals} />
        {suffix && <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
