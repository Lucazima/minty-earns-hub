import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getCommissionRates, updateCommissionRate } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/commissions/rates")({
  head: () => ({
    meta: [
      { title: "Taxas por tier — PalazeHub Admin" },
      { name: "description", content: "Configure a comissão paga a cada nível de promoter." },
    ],
  }),
  component: RatesPage,
});

function RatesPage() {
  const fn = useServerFn(getCommissionRates);
  const upd = useServerFn(updateCommissionRate);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "rates"], queryFn: () => fn() });
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data) setValues(Object.fromEntries(data.map((r: any) => [r.tier, String(r.percent)])));
  }, [data]);

  const mut = useMutation({
    mutationFn: (v: { tier: string; percent: number }) => upd({ data: v }),
    onSuccess: () => { toast.success("Taxa atualizada"); qc.invalidateQueries({ queryKey: ["admin", "rates"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Configuração</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Taxas por tier</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Percentual que o promoter recebe sobre o depósito do referido, por nível.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data ?? []).map((r: any) => (
          <div key={r.tier} className="rounded-2xl border border-border/60 bg-surface p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Tier</div>
            <div className="mt-1 font-display text-lg font-bold capitalize">{r.tier}</div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={values[r.tier] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [r.tier]: e.target.value }))}
                className="w-24 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-right text-lg font-semibold tabular outline-none focus:border-secondary/60"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <button
              onClick={() => {
                const n = Number(values[r.tier]);
                if (Number.isNaN(n) || n < 0) return toast.error("Percentual inválido");
                mut.mutate({ tier: r.tier, percent: n });
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/90"
            >
              <Save className="h-3.5 w-3.5" /> Salvar
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Atualizado em {new Date(r.updated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
