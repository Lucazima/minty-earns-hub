import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/extrato")({
  head: () => ({
    meta: [
      { title: "Extrato — PalazeHub" },
      { name: "description", content: "Cada centavo que você ganhou, do jeito mais claro possível." },
    ],
  }),
  component: Extrato,
});

type Entry = {
  kind: "commission" | "withdrawal" | "signup";
  title: string;
  detail: string;
  amount: number; // positive = in, negative = out
  when: string;
  day: string;
};

const groups: { day: string; total: number; items: Entry[] }[] = [
  {
    day: "Hoje",
    total: 158.4,
    items: [
      { kind: "commission", title: "Comissão de Lucas T.", detail: "depositou R$ 300", amount: 45, when: "14:22", day: "Hoje" },
      { kind: "signup", title: "Nova indicação: Carla M.", detail: "se cadastrou pelo seu link", amount: 15, when: "12:08", day: "Hoje" },
      { kind: "commission", title: "Comissão de Rafa P.", detail: "depositou R$ 650", amount: 98.4, when: "09:14", day: "Hoje" },
    ],
  },
  {
    day: "Ontem",
    total: 320,
    items: [
      { kind: "withdrawal", title: "Você recebeu no Pix", detail: "para chave marina@…", amount: -320, when: "18:44", day: "Ontem" },
      { kind: "commission", title: "Comissão de Bruno S.", detail: "depositou R$ 800", amount: 120, when: "11:02", day: "Ontem" },
    ],
  },
  {
    day: "Esta semana",
    total: 480.6,
    items: [
      { kind: "commission", title: "Comissão de Ana L.", detail: "depositou R$ 500", amount: 75, when: "seg, 20:14", day: "Esta semana" },
      { kind: "commission", title: "Comissão diária apurada", detail: "6 pessoas ativas", amount: 210.6, when: "seg, 09:00", day: "Esta semana" },
      { kind: "signup", title: "Nova indicação: Pedro V.", detail: "se cadastrou pelo seu link", amount: 15, when: "dom, 22:03", day: "Esta semana" },
      { kind: "commission", title: "Comissão de Julia F.", detail: "depositou R$ 400", amount: 60, when: "dom, 16:41", day: "Esta semana" },
    ],
  },
];

function Extrato() {
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

        {groups.map((g) => (
          <section key={g.day}>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {g.day}
              </h2>
              <span className="font-display text-sm font-semibold tabular text-foreground">
                {g.total >= 0 ? "+" : ""}R$ {g.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="surface-card divide-y divide-border/40 overflow-hidden">
              {g.items.map((it, i) => (
                <EntryRow key={i} entry={it} />
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
