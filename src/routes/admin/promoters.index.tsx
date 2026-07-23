import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPromoters, updatePromoterStatus } from "@/lib/admin.functions";
import { Check, X, Search, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/promoters/")({
  head: () => ({
    meta: [
      { title: "Promoters — PalazeHub Admin" },
      { name: "description", content: "Gestão completa dos promoters da plataforma." },
    ],
  }),
  component: PromotersPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando aprovação",
  active: "Ativo",
  suspended: "Suspenso",
  banned: "Banido",
};

function PromotersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [tier, setTier] = useState("all");

  const fn = useServerFn(listPromoters);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "promoters", { search, status, tier }],
    queryFn: () => fn({ data: { search, status, tier } }),
  });

  const updateStatusFn = useServerFn(updatePromoterStatus);
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateStatusFn({ data: v }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao atualizar"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Gestão</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Promoters</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aprove, ajuste tier e monitore toda a rede. Cada linha leva ao histórico completo.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-surface p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, e-mail ou handle"
            className="w-full rounded-lg border border-border/50 bg-background/60 py-2 pl-9 pr-3 text-sm outline-none focus:border-secondary/60"
          />
        </div>
        <Select value={status} onChange={setStatus} options={[["all","Todos os status"],["pending","Aguardando"],["active","Ativos"],["suspended","Suspensos"],["banned","Banidos"]]} />
        <Select value={tier} onChange={setTier} options={[["all","Todos os tiers"],["novato","Novato"],["prata","Prata"],["ouro","Ouro"],["diamante","Diamante"]]} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : !data || data.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nenhum promoter encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-background/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Promoter</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Volume gerado</th>
                <th className="px-4 py-3 text-right">Indicações</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.map((p: any) => (
                <tr key={p.user_id} className="hover:bg-background/40">
                  <td className="px-4 py-3">
                    <Link to="/admin/promoters/$id" params={{ id: p.user_id }} className="group flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary/15 text-xs font-semibold text-secondary">
                        {(p.display_name ?? "?").slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <div className="font-medium group-hover:text-secondary">{p.display_name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.email ?? "—"} · @{p.referral_code}</div>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.tier}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular">R$ {Number(p.volume).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right tabular">{p.referrals}</td>
                  <td className="px-4 py-3 text-right">
                    {p.status === "pending" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => statusMut.mutate({ id: p.user_id, status: "active" })}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          <Check className="h-3 w-3" /> Aprovar
                        </button>
                        <button
                          onClick={() => statusMut.mutate({ id: p.user_id, status: "banned" })}
                          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" /> Rejeitar
                        </button>
                      </div>
                    ) : (
                      <Link to="/admin/promoters/$id" params={{ id: p.user_id }} className="inline-flex items-center text-xs text-muted-foreground hover:text-secondary">
                        Detalhes <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {data?.length ?? 0} promoter{(data?.length ?? 0) === 1 ? "" : "s"} listado{(data?.length ?? 0) === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-primary/15 text-primary",
    pending: "bg-warning/15 text-warning",
    suspended: "bg-muted text-muted-foreground",
    banned: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? ""}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm outline-none focus:border-secondary/60"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}
