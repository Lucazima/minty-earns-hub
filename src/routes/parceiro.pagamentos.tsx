import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, Lock, FileText, ArrowRight, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { PartnerShell } from "@/components/PartnerShell";
import { promoters, brl } from "@/lib/partnerData";

export const Route = createFileRoute("/parceiro/pagamentos")({
  head: () => ({
    meta: [
      { title: "Confirmar repasse — Portal PalazeHub" },
      { name: "description", content: "Revise e aprove o repasse mensal das comissões dos seus promotores." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pagamentos,
});

function Pagamentos() {
  const eligible = promoters.filter((p) => p.status !== "pausado");
  const [selected, setSelected] = useState<Set<string>>(new Set(eligible.map((p) => p.id)));
  const [confirmed, setConfirmed] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = useMemo(
    () => eligible.filter((p) => selected.has(p.id)).reduce((s, p) => s + p.commissionDue, 0),
    [selected, eligible]
  );

  if (confirmed) {
    return (
      <PartnerShell>
        <div className="mx-auto max-w-lg pt-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="font-display mt-6 text-3xl font-bold tracking-tight">Repasse confirmado</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {brl(total)} liberados para {selected.size} promotores. O pagamento cai na conta deles até sexta, 21/11, e você recebe a nota fiscal por email em até 24 h.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => setConfirmed(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
            >
              Voltar
            </button>
          </div>
        </div>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell>
      <div className="space-y-6">
        <header>
          <p className="eyebrow">Repasse mensal</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight">Confirmar valores a pagar</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Revise linha por linha e confirme. A PalazeHub emite a nota fiscal, retém os tributos e paga os promotores por você.
          </p>
        </header>

        {/* Trust bar */}
        <div className="surface-card grid gap-3 p-5 md:grid-cols-3">
          <Trust icon={<ShieldCheck className="h-4 w-4" />} title="Fatura única" body="Um pagamento à PalazeHub, distribuído automaticamente a cada promotor." />
          <Trust icon={<FileText className="h-4 w-4" />} title="Nota fiscal em 24 h" body="Emitida com todos os retidos federais e municipais aplicáveis." />
          <Trust icon={<Lock className="h-4 w-4" />} title="Auditável" body="Todas as movimentações ficam disponíveis por 5 anos no seu portal." />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Table */}
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold">Comissões apuradas · Novembro/2026</h2>
                <p className="text-xs text-muted-foreground">Marque os promotores incluídos neste repasse.</p>
              </div>
              <button
                onClick={() =>
                  setSelected((prev) =>
                    prev.size === eligible.length ? new Set() : new Set(eligible.map((p) => p.id))
                  )
                }
                className="text-xs font-medium text-secondary hover:underline"
              >
                {selected.size === eligible.length ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="w-10 px-5 py-3" />
                    <th className="px-2 py-3 font-medium">Promotor</th>
                    <th className="px-5 py-3 text-right font-medium">NGR</th>
                    <th className="px-5 py-3 text-right font-medium">Base 25%</th>
                    <th className="px-5 py-3 text-right font-medium">A pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {eligible.map((p) => {
                    const checked = selected.has(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => toggle(p.id)}
                        className={`cursor-pointer transition ${checked ? "bg-primary/[0.04]" : "hover:bg-surface-elevated/40"}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className={`grid h-5 w-5 place-items-center rounded-md border transition ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                            {checked && <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />}
                          </span>
                        </td>
                        <td className="px-2 py-3.5">
                          <p className="font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.handle} · {p.tier}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right tabular text-muted-foreground">{brl(p.ngrMTD)}</td>
                        <td className="px-5 py-3.5 text-right tabular text-muted-foreground">{brl(p.ngrMTD * 0.25)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold tabular text-primary">{brl(p.commissionDue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary sidebar */}
          <aside className="space-y-4">
            <div className="surface-card p-5">
              <span className="eyebrow">Total do repasse</span>
              <div className="font-display mt-3 text-4xl font-bold tabular text-primary">{brl(total)}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                {selected.size} de {eligible.length} promotores selecionados.
              </p>

              <ul className="mt-5 space-y-2 text-sm">
                {[
                  ["Comissões", brl(total)],
                  ["Taxa da plataforma (3%)", brl(total * 0.03)],
                  ["Retenção fiscal", "Incluída na NF"],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground tabular">{v}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-elevated/50 p-3 text-sm">
                <span className="text-muted-foreground">Total a debitar</span>
                <span className="font-display text-base font-bold tabular">{brl(total * 1.03)}</span>
              </div>

              <button
                onClick={() => selected.size > 0 && setConfirmed(true)}
                disabled={selected.size === 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar e liberar pagamento
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.5} />
                Ao confirmar, você autoriza o débito na conta cadastrada (Itaú ****4021). Operação registrada em log de auditoria.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Precisa contestar um valor?</p>
              <p className="mt-1">Desmarque o promotor e deixe uma nota. A gente investiga em até 48 h antes de refazer a cobrança.</p>
            </div>
          </aside>
        </div>
      </div>
    </PartnerShell>
  );
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
