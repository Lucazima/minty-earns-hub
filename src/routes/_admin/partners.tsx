import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPartners, createPartner, updatePartner } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Plus, Copy, Power } from "lucide-react";

export const Route = createFileRoute("/_admin/partners")({
  head: () => ({
    meta: [
      { title: "Parceiros BET — PalazeHub Admin" },
      { name: "description", content: "Cadastro de operadoras integradas e chaves de webhook." },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const fn = useServerFn(listPartners);
  const createFn = useServerFn(createPartner);
  const updateFn = useServerFn(updatePartner);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "partners"], queryFn: () => fn() });

  const [form, setForm] = useState({ name: "", contact_email: "", contact_phone: "", commission_rate: "15", webhook_url: "" });
  const [showForm, setShowForm] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { ...form, commission_rate: Number(form.commission_rate) } }),
    onSuccess: (r) => {
      toast.success("Parceiro criado");
      setIssuedKey(r.apiKey);
      setForm({ name: "", contact_email: "", contact_phone: "", commission_rate: "15", webhook_url: "" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateFn({ data: v }),
    onSuccess: () => { toast.success("Parceiro atualizado"); qc.invalidateQueries({ queryKey: ["admin", "partners"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Integrações</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Parceiros BET</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre operadoras, gere chaves de webhook e acompanhe performance.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
        >
          <Plus className="h-4 w-4" /> Novo parceiro
        </button>
      </div>

      {issuedKey && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <div className="text-[11px] uppercase tracking-wider text-primary">Chave API gerada — mostre uma única vez</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-background/60 px-3 py-2 font-mono text-xs">{issuedKey}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(issuedKey); toast.success("Copiada"); }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground"
            ><Copy className="h-3 w-3" /> Copiar</button>
            <button onClick={() => setIssuedKey(null)} className="rounded-md bg-surface px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Fechar</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-border/60 bg-surface p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Cadastrar parceiro</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="E-mail de contato" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />
            <Field label="Telefone" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
            <Field label="Taxa de comissão (%)" value={form.commission_rate} onChange={(v) => setForm({ ...form, commission_rate: v })} type="number" />
            <div className="sm:col-span-2">
              <Field label="URL de webhook (turnover)" value={form.webhook_url} onChange={(v) => setForm({ ...form, webhook_url: v })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { if (!form.name.trim()) return toast.error("Nome obrigatório"); createMut.mutate(); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >Criar parceiro</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg bg-surface px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <p className="col-span-2 p-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : !data || data.length === 0 ? (
          <p className="col-span-2 p-10 text-center text-sm text-muted-foreground">Nenhum parceiro cadastrado.</p>
        ) : (
          data.map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-border/60 bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.contact_email || "—"} · {p.contact_phone || "—"}</p>
                </div>
                <button
                  onClick={() => toggleMut.mutate({ id: p.id, status: p.status === "active" ? "paused" : "active" })}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.status === "active" ? "bg-primary/15 text-primary hover:bg-primary/25" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Power className="h-3 w-3" /> {p.status === "active" ? "Ativo" : "Pausado"}
                </button>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Taxa</dt>
                  <dd className="font-display text-lg font-bold text-primary tabular">{Number(p.commission_rate).toFixed(1)}%</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Webhook</dt>
                  <dd className="truncate text-xs text-muted-foreground">{p.webhook_url || "não configurado"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-muted-foreground">
                API key hash: <code className="font-mono">{(p.api_key_hash ?? "").slice(0, 12) || "—"}…</code>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm outline-none focus:border-secondary/60"
      />
    </label>
  );
}
