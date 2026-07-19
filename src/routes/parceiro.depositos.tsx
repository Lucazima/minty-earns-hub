import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { PartnerShell } from "@/components/PartnerShell";
import { promoters, brl } from "@/lib/partnerData";

export const Route = createFileRoute("/parceiro/depositos")({
  head: () => ({
    meta: [
      { title: "Depósitos por promotor — Portal PalazeHub" },
      { name: "description", content: "Relatório mensal de depósitos gerados por cada promotor, exportável em CSV." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Depositos,
});

type Period = "mtd" | "30d" | "90d";

const periodLabel: Record<Period, string> = {
  mtd: "Mês atual (nov/2026)",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};

const periodFactor: Record<Period, number> = { mtd: 1, "30d": 1.08, "90d": 2.9 };

function Depositos() {
  const [period, setPeriod] = useState<Period>("mtd");
  const rows = useMemo(() => {
    const f = periodFactor[period];
    return promoters.map((p) => {
      const deposits = Math.round(p.depositsMTD * f);
      const ngr = Math.round(p.ngrMTD * f);
      const players = Math.round(p.activePlayers * (period === "90d" ? 1.6 : 1));
      const avgTicket = Math.round(deposits / Math.max(players, 1));
      return { ...p, deposits, ngr, players, avgTicket };
    }).sort((a, b) => b.deposits - a.deposits);
  }, [period]);

  const totalDeposits = rows.reduce((s, r) => s + r.deposits, 0);
  const totalNgr = rows.reduce((s, r) => s + r.ngr, 0);
  const totalPlayers = rows.reduce((s, r) => s + r.players, 0);

  const exportCsv = () => {
    const header = ["promotor", "@usuario", "nivel", "jogadores_ativos", "depositos_brl", "ngr_brl", "ticket_medio_brl"];
    const body = rows.map((r) => [
      r.name, r.handle, r.tier, r.players,
      r.deposits.toFixed(2).replace(".", ","),
      r.ngr.toFixed(2).replace(".", ","),
      r.avgTicket.toFixed(2).replace(".", ","),
    ].join(";"));
    const csv = "\ufeff" + [header.join(";"), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `depositos_promotores_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PartnerShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Relatório</p>
            <h1 className="font-display mt-1 text-3xl font-bold tracking-tight">Depósitos por promotor</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Quanto cada promotor gerou em depósitos e receita bruta. Números conciliados diariamente com sua plataforma.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-background p-1">
              {(["mtd", "30d", "90d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    period === p ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "mtd" ? "Mês atual" : p === "30d" ? "30 dias" : "90 dias"}
                </button>
              ))}
            </div>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <Download className="h-4 w-4" strokeWidth={2.5} />
              Exportar CSV
            </button>
          </div>
        </header>

        {/* Summary */}
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label={`Depósitos · ${periodLabel[period]}`} value={brl(totalDeposits)} delta="+14,2%" up />
          <SummaryCard label="NGR consolidado" value={brl(totalNgr)} delta="+9,8%" up />
          <SummaryCard label="Jogadores ativos" value={totalPlayers.toLocaleString("pt-BR")} delta="-2,1%" />
        </section>

        {/* Report table */}
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold">Detalhado por promotor</h2>
              <p className="text-xs text-muted-foreground">Ordenado pelo maior volume de depósito.</p>
            </div>
            <span className="rounded-full bg-surface-elevated px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {rows.length} linhas · {periodLabel[period]}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Promotor</th>
                  <th className="px-5 py-3 text-right font-medium">Jogadores</th>
                  <th className="px-5 py-3 text-right font-medium">Ticket médio</th>
                  <th className="px-5 py-3 text-right font-medium">NGR</th>
                  <th className="px-5 py-3 text-right font-medium">Depósitos</th>
                  <th className="px-5 py-3 text-right font-medium">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((r) => {
                  const share = (r.deposits / totalDeposits) * 100;
                  return (
                    <tr key={r.id} className="transition hover:bg-surface-elevated/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary/15 text-[11px] font-semibold text-secondary">
                            {r.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.handle} · {r.tier}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular text-muted-foreground">{r.players}</td>
                      <td className="px-5 py-3.5 text-right tabular text-muted-foreground">{brl(r.avgTicket)}</td>
                      <td className="px-5 py-3.5 text-right tabular">{brl(r.ngr)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular">{brl(r.deposits)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-elevated">
                            <div className="h-full bg-primary/80" style={{ width: `${share}%` }} />
                          </div>
                          <span className="w-10 text-right text-xs tabular text-muted-foreground">{share.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-border/60 bg-surface-elevated/30 text-sm">
                <tr>
                  <td className="px-5 py-3.5 font-semibold text-foreground">Total</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular">{totalPlayers.toLocaleString("pt-BR")}</td>
                  <td />
                  <td className="px-5 py-3.5 text-right font-semibold tabular">{brl(totalNgr)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular text-primary">{brl(totalDeposits)}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-muted-foreground">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Dados conciliados diariamente às 06:00 (BRT). Última sincronização: hoje, 06:04. Divergências? Fale com <a href="mailto:parceiros@palazehub.com" className="text-secondary hover:underline">parceiros@palazehub.com</a>.
        </p>
      </div>
    </PartnerShell>
  );
}

function SummaryCard({ label, value, delta, up = false }: { label: string; value: string; delta: string; up?: boolean }) {
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className="surface-card p-5">
      <span className="eyebrow">{label}</span>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-display text-2xl font-bold tabular text-foreground">{value}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${up ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
          <Icon className="h-3 w-3" strokeWidth={2.5} />
          {delta}
        </span>
      </div>
    </div>
  );
}
