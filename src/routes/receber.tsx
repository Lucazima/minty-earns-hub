import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, ShieldCheck, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CountUp } from "@/components/CountUp";

export const Route = createFileRoute("/receber")({
  head: () => ({
    meta: [
      { title: "Receber — PalazeHub" },
      { name: "description", content: "Peça seu dinheiro. Cai na hora no seu Pix." },
    ],
  }),
  component: Receber,
});

const available = 1240.9;

function Receber() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pixKey, setPixKey] = useState("marina@email.com");

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-8">
        <div>
          <p className="eyebrow">Passo {step} de 2</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            {step === 3 ? "Prontinho." : "Receber agora."}
          </h1>
        </div>

        {/* Available amount card */}
        <section className="hero-card relative p-6 md:p-8">
          <div className="hero-glow" />
          <div className="relative">
            <span className="eyebrow">Disponível pra você</span>
            <div className="mt-3">
              <span className="font-display text-5xl font-bold text-primary md:text-6xl">
                R$&nbsp;<CountUp value={available} />
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                <Zap className="h-3 w-3" strokeWidth={2.5} /> Cai na hora
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" strokeWidth={2.5} />
                Transferência via Pix
              </span>
            </div>
          </div>
        </section>

        {step === 1 && (
          <section className="surface-card space-y-5 p-5 md:p-6">
            <div>
              <label className="eyebrow" htmlFor="pix">Sua chave Pix</label>
              <input
                id="pix"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3.5 font-display text-lg font-semibold text-foreground outline-none focus:border-primary/60"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Pode ser CPF, e-mail, telefone ou chave aleatória.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.99]"
            >
              Continuar <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="surface-card space-y-5 p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold">Confere se está tudo certo</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Valor" value={`R$ ${available.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} strong />
              <Row label="Para a chave Pix" value={pixKey} />
              <Row label="Chega em" value="Alguns segundos" />
              <Row label="Taxa" value="Sem taxa" />
            </dl>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-border bg-transparent px-5 py-3.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.99]"
              >
                Confirmar e receber
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="surface-card p-6 text-center md:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Check className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <h2 className="font-display mt-5 text-2xl font-semibold">Enviado.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              R$ {available.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} caindo na sua chave {pixKey}. Costuma chegar em poucos segundos.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition hover:brightness-110"
            >
              Voltar ao painel
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`tabular text-right ${strong ? "font-display text-lg font-bold text-primary" : "font-medium text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
