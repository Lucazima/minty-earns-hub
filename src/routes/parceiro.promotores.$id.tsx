import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Mail, PauseCircle, PlayCircle, TrendingUp,
  Users, Wallet, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { PartnerShell } from "@/components/PartnerShell";
import { CountUp } from "@/components/CountUp";
import {
  promoters, brl, tierClass, statusClass, statusLabel,
  depositsHistory, recentDepositsFor, type Promoter,
} from "@/lib/partnerData";

export const Route = createFileRoute("/parceiro/promotores/$id")({
  head: ({ params }) => {
    const p = promoters.find((x) => x.id === params.id);
    return {
      meta: [
        { title: p ? `${p.name} — Portal PalazeHub` : "Promotor não encontrado — PalazeHub" },
        { name: "description", content: "Detalhe de um promotor vinculado à sua operação." },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: ({ params }) => {
    const p = promoters.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return { promoter: p };
  },
  notFoundComponent: () => (
    <PartnerShell>
      <div className="mx-auto max-w-md pt-16 text-center">
        <h1 className="font-display text-2xl font-bold">Promotor não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Talvez o link esteja desatualizado.</p>
        <Link to="/parceiro/promotores" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Voltar aos promotores
        </Link>
      </div>
    </PartnerShell>
  ),
  component: PromoterDetail,
});

function PromoterDetail() {
  const { promoter } = Route.useLoaderData() as { promoter: Promoter };
  const router = useRouter();
  const [status, setStatus] = useState<Promoter["status"]>(promoter.status);
  const history = depositsHistory(promoter);
  const recent = recentDepositsFor(promoter);
  const refLink = `https://palaze.bet/r/${promoter.handle.replace("@", "")}`;

  const togglePause = () => {
    const next = status === "pausado" ? "ativo" : "pausado";
    setStatus(next);
    toast.success(next === "pausado" ? `${promoter.name} foi pausado` : `${promoter.name} reativado`, {
      description: next === "pausado"
        ? "As indicações dele não vão gerar comissão até você reativar."
        : "O link dele voltou a funcionar normalmente.",
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      toast.success("Link do promotor copiado");
    } catch {
      toast.error("Não deu para copiar. Tente selecionar o texto manualmente.");
    }
  };

  const message = () => {
    window.location.href = `mailto:${promoter.handle.replace("@", "")}@promotor.palazehub.com?subject=Sobre suas comissões`;
    toast("Abrindo seu app de email");
  };

  return (
    <PartnerShell>
      <div className="space-y-6">
        <button
          onClick={() => router.history.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Voltar aos promotores
        </button>

        {/* Header */}
        <header className="surface-card flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary/15 text-lg font-semibold text-secondary">
              {promoter.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">{promoter.name}</h1>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${tierClass[promoter.tier]}`}>
                  {promoter.tier}
                </span>
                <StatusPill status={status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {promoter.handle} · entrou em {new Date(promoter.joinedAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · {promoter.lastActivity}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
            >
              <Copy className="h-4 w-4" strokeWidth={2} /> Copiar link
            </button>
            <button
              onClick={message}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
            >
              <Mail className="h-4 w-4" strokeWidth={2} /> Enviar mensagem
            </button>
            <button
              onClick={togglePause}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === "pausado"
                  ? "bg-primary text-primary-foreground hover:brightness-110"
                  : "bg-warning/15 text-warning hover:bg-warning/20"
              }`}
            >
              {status === "pausado" ? <PlayCircle className="h-4 w-4" strokeWidth={2.5} /> : <PauseCircle className="h-4 w-4" strokeWidth={2.5} />}
              {status === "pausado" ? "Reativar" : "Pausar promotor"}
            </button>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid gap-4 md:grid-cols-3">
          <Kpi icon={<Users className="h-4 w-4" strokeWidth={2} />} label="Pessoas indicadas" value={promoter.referred} />
          <Kpi icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />} label="Depósitos no mês" value={promoter.depositsMTD} prefix="R$ " decimals={0} />
          <Kpi icon={<Wallet className="h-4 w-4" strokeWidth={2} />} label="Comissão devida" value={promoter.commissionDue} prefix="R$ " decimals={2} highlight />
        </section>

        {/* Sparkline + recent deposits */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="surface-card p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-base font-semibold">Depósitos gerados</h2>
                <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
              </div>
              <span className="font-display text-xl font-bold tabular">{brl(history.reduce((s, n) => s + n, 0))}</span>
            </div>
            <Sparkline values={history} />
            <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Jun", "Jul", "Ago", "Set", "Out", "Nov"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="font-display text-base font-semibold">Últimos depósitos</h2>
            <p className="text-xs text-muted-foreground">Pelos jogadores que ele indicou</p>
            <ul className="mt-4 space-y-3">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between border-b border-border/40 pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">{r.player}</p>
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                  </div>
                  <span className="font-semibold tabular">{brl(r.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PartnerShell>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 600, h = 120, pad = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, h - pad - ((v - min) / range) * (h - pad * 2)] as const);
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 h-32 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2.5} fill="hsl(var(--primary))" />
      ))}
    </svg>
  );
}

function StatusPill({ status }: { status: Promoter["status"] }) {
  const Icon = status === "ativo" ? CheckCircle2 : status === "pausado" ? PauseCircle : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass[status]}`}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {statusLabel[status]}
    </span>
  );
}

function Kpi({
  icon, label, value, prefix = "", decimals = 0, highlight = false,
}: {
  icon: React.ReactNode; label: string; value: number;
  prefix?: string; decimals?: number; highlight?: boolean;
}) {
  return (
    <div className={`surface-card p-5 ${highlight ? "ring-1 ring-primary/40" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="eyebrow">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${highlight ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>
          {icon}
        </span>
      </div>
      <div className={`font-display mt-4 text-2xl font-bold tabular ${highlight ? "text-primary" : "text-foreground"}`}>
        <CountUp value={value} prefix={prefix} decimals={decimals} />
      </div>
    </div>
  );
}
