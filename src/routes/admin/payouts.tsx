import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  listPayouts,
  approvePayouts,
  rejectPayout,
  getPlatformSetting,
  setPlatformSetting,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { Check, X, Save } from "lucide-react";

export const Route = createFileRoute("/admin/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts — PalazeHub Admin" },
      { name: "description", content: "Fila de saques com aprovação em lote e histórico contábil." },
    ],
  }),
  component: PayoutsPage,
});

function PayoutsPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const fn = useServerFn(listPayouts);
  const approveFn = useServerFn(approvePayouts);
  const rejectFn = useServerFn(rejectPayout);
  const getSet = useServerFn(getPlatformSetting);
  const setSet = useServerFn(setPlatformSetting);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payouts", tab],
    queryFn: () => fn({ data: { status: tab === "pending" ? "pending" : undefined } }),
  });
  const { data: minAmountRaw } = useQuery({
    queryKey: ["admin", "min-withdrawal"],
    queryFn: () => getSet({ data: { key: "min_withdrawal_amount" } }),
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => setSelected(new Set()), [tab]);

  const approveMut = useMutation({
    mutationFn: (ids: string[]) => approveFn({ data: { ids } }),
    onSuccess: (r) => { toast.success(`${r.count} payout(s) aprovados`); setSelected(new Set()); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (v: { id: string; reason: string }) => rejectFn({ data: v }),
    onSuccess: () => { toast.success("Payout recusado"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const [minAmount, setMinAmount] = useState("");
  useEffect(() => { if (minAmountRaw != null) setMinAmount(String(minAmountRaw)); }, [minAmountRaw]);
  const minMut = useMutation({
    mutationFn: (v: string) => setSet({ data: { key: "min_withdrawal_amount", value: v } }),
    onSuccess: () => { toast.success("Valor mínimo salvo"); qc.invalidateQueries({ queryKey: ["admin", "min-withdrawal"] }); },
  });

  const list = (data ?? []) as any[];
  const filtered = tab === "history" ? list.filter((w) => w.status !== "pending") : list;
  const totalSelected = filtered.filter((w) => selected.has(w.id)).reduce((s, w) => s + Number(w.amount), 0);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Financeiro</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fila de saques com aprovação em lote. Integrado com Pagar.me na próxima fase.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-surface p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor mínimo de saque</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">R$</span>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-24 rounded-lg border border-border/50 bg-background/60 px-2 py-1 text-right text-sm tabular outline-none focus:border-secondary/60"
            />
            <button
              onClick={() => minMut.mutate(minAmount)}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/90"
            >
              <Save className="h-3 w-3" /> Salvar
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["pending", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
              tab === t ? "bg-secondary text-secondary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "pending" ? "Fila pendente" : "Histórico"}
          </button>
        ))}
      </div>

      {tab === "pending" && selected.size > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <div className="text-sm">
            {selected.size} selecionado(s) — total{" "}
            <span className="font-display font-bold text-primary tabular">
              R$ {totalSelected.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={() => approveMut.mutate(Array.from(selected))}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Aprovar em lote
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {tab === "pending" ? "Sem solicitações pendentes." : "Nenhum payout processado ainda."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-background/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {tab === "pending" && <th className="w-8 px-3 py-3"></th>}
                <th className="px-4 py-3 text-left">Promoter</th>
                <th className="px-4 py-3 text-left">Chave Pix</th>
                <th className="px-4 py-3 text-left">Solicitado em</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-background/40">
                  {tab === "pending" && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(w.id)}
                        onChange={() => toggle(w.id)}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium">{w.promoter_name}</div>
                    <div className="text-[11px] text-muted-foreground">{w.promoter_email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{w.pix_key}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right font-display font-semibold tabular">R$ {Number(w.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={w.status} />
                    {w.rejection_reason && (<div className="mt-1 text-[10px] text-muted-foreground">motivo: {w.rejection_reason}</div>)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {w.status === "pending" && (
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => approveMut.mutate([w.id])}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
                        ><Check className="h-3 w-3" /> Aprovar</button>
                        <button
                          onClick={() => {
                            const reason = prompt("Motivo da recusa (obrigatório):") ?? "";
                            if (reason.trim().length < 3) return toast.error("Motivo obrigatório");
                            rejectMut.mutate({ id: w.id, reason });
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                        ><X className="h-3 w-3" /> Recusar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; l: string }> = {
    pending: { c: "bg-warning/15 text-warning", l: "Pendente" },
    processing: { c: "bg-secondary/15 text-secondary", l: "Processando" },
    paid: { c: "bg-primary/15 text-primary", l: "Pago" },
    rejected: { c: "bg-destructive/15 text-destructive", l: "Recusado" },
    failed: { c: "bg-destructive/15 text-destructive", l: "Falha" },
  };
  const it = map[status] ?? { c: "", l: status };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${it.c}`}>{it.l}</span>;
}
