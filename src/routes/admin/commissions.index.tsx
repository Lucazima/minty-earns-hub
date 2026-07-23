import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCommissions, updateCommissionStatus, editCommissionAmount } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Check, X, Pencil } from "lucide-react";

export const Route = createFileRoute("/_admin/commissions/")({
  head: () => ({
    meta: [
      { title: "Comissões — PalazeHub Admin" },
      { name: "description", content: "Auditoria e aprovação de comissões antes do payout." },
    ],
  }),
  component: CommissionsPage,
});

function CommissionsPage() {
  const [status, setStatus] = useState<string>("pending");
  const fn = useServerFn(listCommissions);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "commissions", { status }],
    queryFn: () => fn({ data: { status } }),
  });

  const statusFn = useServerFn(updateCommissionStatus);
  const editFn = useServerFn(editCommissionAmount);

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" }) => statusFn({ data: v }),
    onSuccess: () => { toast.success("Comissão atualizada"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const editMut = useMutation({
    mutationFn: (v: { id: string; amount: number; reason: string }) => editFn({ data: v }),
    onSuccess: () => { toast.success("Valor editado"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const totalPending = (data ?? []).filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Gestão</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Comissões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Camada de segurança antes do payout — aprove, rejeite ou corrija valores com motivo registrado.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total pendente</div>
          <div className="font-display text-lg font-bold text-primary tabular">
            R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
              status === s ? "bg-secondary text-secondary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "Todas" : s === "pending" ? "Pendentes" : s === "approved" ? "Aprovadas" : "Rejeitadas"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : !data || data.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nenhuma comissão neste filtro.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-background/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Comissão</th>
                <th className="px-4 py-3 text-left">Promoter</th>
                <th className="px-4 py-3 text-left">Origem</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.map((c: any) => (
                <tr key={c.id} className="hover:bg-background/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground">{c.detail} · {new Date(c.occurred_at).toLocaleDateString("pt-BR")}</div>
                  </td>
                  <td className="px-4 py-3">{c.promoter_name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{c.source_ref || "—"}</td>
                  <td className="px-4 py-3 text-right font-display font-semibold text-primary tabular">
                    R$ {Number(c.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={c.status} />
                    {c.edit_reason && (
                      <div className="mt-1 text-[10px] text-muted-foreground">editada: {c.edit_reason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1.5">
                      {c.status === "pending" && (
                        <>
                          <button
                            onClick={() => statusMut.mutate({ id: c.id, status: "approved" })}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Motivo da rejeição:") ?? "";
                              if (reason.trim().length >= 3) statusMut.mutate({ id: c.id, status: "rejected" });
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          const nv = prompt(`Novo valor (atual R$ ${Number(c.amount).toFixed(2)}):`);
                          if (!nv) return;
                          const amount = Number(nv.replace(",", "."));
                          if (Number.isNaN(amount)) return toast.error("Valor inválido");
                          const reason = prompt("Motivo da correção (obrigatório):") ?? "";
                          if (reason.trim().length < 3) return toast.error("Motivo obrigatório");
                          editMut.mutate({ id: c.id, amount, reason });
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
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
    approved: { c: "bg-primary/15 text-primary", l: "Aprovada" },
    rejected: { c: "bg-destructive/15 text-destructive", l: "Rejeitada" },
    paid: { c: "bg-secondary/15 text-secondary", l: "Paga" },
  };
  const it = map[status] ?? { c: "", l: status };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${it.c}`}>{it.l}</span>;
}
