import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getPromoterDetail,
  updatePromoterStatus,
  updatePromoterTier,
  updatePromoterNotes,
} from "@/lib/admin.functions";
import { CountUp } from "@/components/CountUp";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/promoters/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do promoter — PalazeHub Admin" },
      { name: "description", content: "Histórico completo, ajuste de tier e notas internas." },
    ],
  }),
  component: PromoterDetail,
});

const TIERS = ["novato", "prata", "ouro", "diamante"];
const STATUSES: { value: string; label: string }[] = [
  { value: "active", label: "Ativo" },
  { value: "pending", label: "Aguardando aprovação" },
  { value: "suspended", label: "Suspenso" },
  { value: "banned", label: "Banido" },
];

function PromoterDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getPromoterDetail);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "promoter", id],
    queryFn: () => fn({ data: { id } }),
  });

  const tierFn = useServerFn(updatePromoterTier);
  const statusFn = useServerFn(updatePromoterStatus);
  const notesFn = useServerFn(updatePromoterNotes);

  const tierMut = useMutation({
    mutationFn: (tier: string) => tierFn({ data: { id, tier } }),
    onSuccess: () => { toast.success("Tier atualizado"); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  const statusMut = useMutation({
    mutationFn: (status: string) => statusFn({ data: { id, status } }),
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  const notesMut = useMutation({
    mutationFn: (notes: string) => notesFn({ data: { id, notes } }),
    onSuccess: () => { toast.success("Notas salvas"); qc.invalidateQueries({ queryKey: ["admin", "promoter", id] }); },
  });

  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (data?.profile) setNotes(data.profile.admin_notes ?? "");
  }, [data?.profile]);

  if (isLoading || !data) return <div className="py-20 text-center text-sm text-muted-foreground">Carregando…</div>;
  if (!data.profile) return <div className="py-20 text-center text-sm text-muted-foreground">Promoter não encontrado.</div>;

  const p = data.profile;
  const totalEarnings = data.commissions.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const totalDeposited = data.commissions
    .filter((c: any) => c.kind === "commission")
    .reduce((s: number, c: any) => {
      const m = (c.detail as string).match(/R\$\s*([\d.,]+)/);
      return s + (m ? Number(m[1].replace(/\./g, "").replace(",", ".")) || 0 : 0);
    }, 0);
  const totalPaidOut = data.withdrawals
    .filter((w: any) => w.status === "paid")
    .reduce((s: number, w: any) => s + Number(w.amount), 0);

  return (
    <div className="space-y-6">
      <Link to="/admin/promoters" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary">
        <ArrowLeft className="h-3 w-3" /> Voltar para promoters
      </Link>

      <div className="rounded-2xl border border-border/60 bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/15 text-lg font-semibold text-secondary">
              {(p.display_name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{p.display_name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.email ?? "—"} · @{p.referral_code}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Cadastro em {new Date(p.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Status
              <select
                value={p.status}
                onChange={(e) => statusMut.mutate(e.target.value)}
                className="rounded-lg border border-border/50 bg-background/60 px-3 py-1.5 text-sm text-foreground outline-none focus:border-secondary/60"
              >
                {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Tier
              <select
                value={p.tier}
                onChange={(e) => tierMut.mutate(e.target.value)}
                className="rounded-lg border border-border/50 bg-background/60 px-3 py-1.5 text-sm capitalize text-foreground outline-none focus:border-secondary/60"
              >
                {TIERS.map((t) => (<option key={t} value={t} className="capitalize">{t}</option>))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniKpi label="Total de ganhos" value={totalEarnings} />
        <MiniKpi label="Volume depositado" value={totalDeposited} />
        <MiniKpi label="Indicações" value={data.referrals.length} isMoney={false} />
        <MiniKpi label="Já recebido" value={totalPaidOut} />
      </div>

      <section className="rounded-2xl border border-border/60 bg-surface p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Notas internas</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Ex: cliente reclamou de spam via WhatsApp em 12/03…"
          className="mt-3 w-full rounded-lg border border-border/50 bg-background/60 p-3 text-sm outline-none focus:border-secondary/60"
        />
        <button
          onClick={() => notesMut.mutate(notes)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/90"
        >
          <Save className="h-3.5 w-3.5" /> Salvar nota
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <HistoryBlock title="Indicações" items={data.referrals} render={(r: any) => (
          <>
            <div className="text-sm font-medium">{r.referred_name}</div>
            <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
          </>
        )} />
        <HistoryBlock title="Payouts" items={data.withdrawals} render={(w: any) => (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">R$ {Number(w.amount).toFixed(2)}</div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{w.status}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Pix {w.pix_key} · {new Date(w.created_at).toLocaleString("pt-BR")}
            </div>
          </>
        )} />
      </div>

      <section className="rounded-2xl border border-border/60 bg-surface p-5">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider">Comissões</h2>
        {data.commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem comissões ainda.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {data.commissions.slice(0, 30).map((c: any) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.detail} · {new Date(c.occurred_at).toLocaleDateString("pt-BR")} · {c.status}
                  </div>
                </div>
                <div className="font-display font-semibold tabular text-primary">
                  +R$ {Number(c.amount).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MiniKpi({ label, value, isMoney = true }: { label: string; value: number; isMoney?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold tabular">
        <CountUp value={value} prefix={isMoney ? "R$ " : ""} decimals={isMoney ? 2 : 0} />
      </div>
    </div>
  );
}

function HistoryBlock({ title, items, render }: { title: string; items: any[]; render: (i: any) => any }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-surface p-5">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {items.slice(0, 10).map((it: any, i: number) => (
            <li key={it.id ?? i} className="py-2.5">{render(it)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
