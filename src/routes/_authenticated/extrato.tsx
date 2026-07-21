import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  loadCommissions,
  loadWithdrawals,
  groupByDay,
  formatTime,
  type Commission,
} from "@/lib/promoterData";

export const Route = createFileRoute("/_authenticated/extrato")({
  head: () => ({
    meta: [
      { title: "Extrato — PalazeHub" },
      { name: "description", content: "Cada centavo que você ganhou, do jeito mais claro possível." },
    ],
  }),
  component: Extrato,
});

type Entry = {
  kind: "commission" | "signup" | "withdrawal";
  title: string;
  detail: string;
  amount: number;
  when: string;
  key: string;
};

function Extrato() {
  const commissionsQ = useQuery({ queryKey: ["commissions"], queryFn: loadCommissions });
  const withdrawalsQ = useQuery({ queryKey: ["withdrawals"], queryFn: loadWithdrawals });

  const loading = commissionsQ.isLoading || withdrawalsQ.isLoading;
  const commissions = commissionsQ.data ?? [];
  const withdrawals = withdrawalsQ.data ?? [];

  // Build unified entries and group by day (commissions positive, withdrawals negative)
  const allDated: (Commission & { _kind: "in" } | { id: string; kind: "withdrawal"; title: string; detail: string; amount: number; occurred_at: string; _kind: "out" })[] = [
    ...commissions.map((c) => ({ ...c, _kind: "in" as const })),
    ...withdrawals.map((w) => ({
      id: w.id,
      kind: "withdrawal" as const,
      title: w.status === "paid" ? "Você recebeu no Pix" : "Saque solicitado",
      detail: `para chave ${w.pix_key}`,
      amount: -Number(w.amount),
      occurred_at: w.created_at,
      _kind: "out" as const,
    })),
  ].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));

  const groups = groupByDay(allDated as unknown as Commission[]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="eyebrow">Tudo o que rolou</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Seu extrato.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Cada comissão, cada saque, cada pessoa nova. Sem letra miúda.
          </p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="surface-card h-24 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="surface-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não tem movimentação. Compartilhe seu link e os primeiros ganhos aparecem aqui.
            </p>
          </div>
        )}

        {!loading && groups.map((g) => (
          <section key={g.day}>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {g.day}
              </h2>
              <span className="font-display text-sm font-semibold tabular text-foreground">
                {g.total >= 0 ? "+" : ""}R$ {Math.abs(g.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="surface-card divide-y divide-border/40 overflow-hidden">
              {g.items.map((it) => (
                <EntryRow
                  key={it.id}
                  entry={{
                    kind: it.kind as Entry["kind"],
                    title: it.title,
                    detail: it.detail,
                    amount: Number(it.amount),
                    when: formatTime(it.occurred_at),
                    key: it.id,
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const isOut = entry.amount < 0;
  const isSignup = entry.kind === "signup";
  const Icon = isOut ? ArrowUpRight : isSignup ? Users : ArrowDownRight;
  const color = isOut
    ? "text-warning bg-warning/15"
    : isSignup
    ? "text-secondary bg-secondary/15"
    : "text-primary bg-primary/15";
  const amountColor = isOut ? "text-warning" : "text-primary";

  return (
    <div className="flex items-center gap-4 px-4 py-4 md:px-5">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
        <p className="truncate text-xs text-muted-foreground">{entry.detail} · {entry.when}</p>
      </div>
      <span className={`font-display shrink-0 text-base font-semibold tabular ${amountColor}`}>
        {isOut ? "" : "+"}R$ {Math.abs(entry.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}
