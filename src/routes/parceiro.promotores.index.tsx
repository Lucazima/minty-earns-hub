import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, CheckCircle2, PauseCircle, AlertTriangle, X, ChevronRight } from "lucide-react";
import { PartnerShell } from "@/components/PartnerShell";
import { promoters, brl, tierClass, statusClass, statusLabel, type Promoter } from "@/lib/partnerData";

export const Route = createFileRoute("/parceiro/promotores")({
  head: () => ({
    meta: [
      { title: "Promotores — Portal PalazeHub" },
      { name: "description", content: "Promotores vinculados à sua operação, com busca e filtros." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Promotores,
});

type TierFilter = "todos" | Promoter["tier"];
type StatusFilter = "todos" | Promoter["status"];
type SortKey = "depositsMTD" | "referred" | "commissionDue" | "name";

function Promotores() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<TierFilter>("todos");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [sort, setSort] = useState<SortKey>("depositsMTD");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return promoters
      .filter((p) => (tier === "todos" ? true : p.tier === tier))
      .filter((p) => (status === "todos" ? true : p.status === status))
      .filter((p) =>
        needle === "" ? true :
        p.name.toLowerCase().includes(needle) ||
        p.handle.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle)
      )
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        return (b[sort] as number) - (a[sort] as number);
      });
  }, [q, tier, status, sort]);

  return (
    <PartnerShell>
      <div className="space-y-6">
        <header>
          <p className="eyebrow">Rede</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight">Promotores vinculados</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {promoters.length} promotores ativos na sua operação. Use a busca ou os filtros para focar em quem importa agora.
          </p>
        </header>

        {/* Toolbar */}
        <div className="surface-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome, @usuário ou ID"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Select
              icon={<SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />}
              label="Nível"
              value={tier}
              onChange={(v) => setTier(v as TierFilter)}
              options={[
                { value: "todos", label: "Todos os níveis" },
                { value: "Diamante", label: "Diamante" },
                { value: "Ouro", label: "Ouro" },
                { value: "Prata", label: "Prata" },
                { value: "Novato", label: "Novato" },
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              options={[
                { value: "todos", label: "Qualquer status" },
                { value: "ativo", label: "Ativo" },
                { value: "revisar", label: "Precisa revisar" },
                { value: "pausado", label: "Pausado" },
              ]}
            />
            <Select
              icon={<ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2} />}
              label="Ordenar"
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              options={[
                { value: "depositsMTD", label: "Maior depósito no mês" },
                { value: "commissionDue", label: "Maior comissão a pagar" },
                { value: "referred", label: "Mais indicações" },
                { value: "name", label: "Nome (A–Z)" },
              ]}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{rows.length}</span> de {promoters.length} promotores.
            </p>
            {(q || tier !== "todos" || status !== "todos") && (
              <button
                onClick={() => { setQ(""); setTier("todos"); setStatus("todos"); }}
                className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-surface/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-3 w-3" strokeWidth={2.5} /> Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Table (desktop) */}
        <div className="surface-card hidden overflow-hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Promotor</th>
                <th className="px-5 py-3 font-medium">Nível</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Indicações</th>
                <th className="px-5 py-3 text-right font-medium">Jogadores ativos</th>
                <th className="px-5 py-3 text-right font-medium">Depósitos (mês)</th>
                <th className="px-5 py-3 text-right font-medium">Comissão devida</th>
                <th className="px-5 py-3 text-right font-medium">Comissão devida</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => { window.location.href = `/parceiro/promotores/${p.id}`; }}
                  className="cursor-pointer transition hover:bg-surface-elevated/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary/15 text-xs font-semibold text-secondary">
                        {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.handle} · {p.lastActivity}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tierClass[p.tier]}`}>
                      {p.tier}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-5 py-4 text-right tabular">{p.referred}</td>
                  <td className="px-5 py-4 text-right tabular text-muted-foreground">{p.activePlayers}</td>
                  <td className="px-5 py-4 text-right font-medium tabular">{brl(p.depositsMTD)}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular text-primary">{brl(p.commissionDue)}</td>
                  <td className="pr-4 text-muted-foreground"><ChevronRight className="h-4 w-4" strokeWidth={2} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum promotor encontrado com esses filtros. Limpe a busca para ver a lista completa.
            </div>
          )}
        </div>

        {/* Cards (mobile) */}
        <ul className="space-y-3 md:hidden">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                to="/parceiro/promotores/$id"
                params={{ id: p.id }}
                className="surface-card block p-4 transition active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.handle}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Stat label="Indicações" value={String(p.referred)} />
                  <Stat label="Depósitos" value={brl(p.depositsMTD)} />
                  <Stat label="Comissão" value={brl(p.commissionDue)} accent />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PartnerShell>
  );
}

function StatusPill({ status }: { status: Promoter["status"] }) {
  const Icon = status === "ativo" ? CheckCircle2 : status === "pausado" ? PauseCircle : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass[status]}`}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {statusLabel[status]}
    </span>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-semibold tabular ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function Select({
  label, value, onChange, options, icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <label className="group flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm text-foreground transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="hidden text-xs text-muted-foreground lg:inline">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent pr-1 text-sm text-foreground focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-background">{o.label}</option>
        ))}
      </select>
    </label>
  );
}
