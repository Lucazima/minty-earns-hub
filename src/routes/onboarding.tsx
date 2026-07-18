import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Share2, Sparkles, Wallet } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Boas-vindas — PalazeHub" },
      { name: "description", content: "Um tour rápido pra você começar a ganhar hoje." },
    ],
  }),
  component: Onboarding,
});

const steps = [
  {
    icon: Share2,
    eyebrow: "Passo 1",
    title: "Compartilhe seu link",
    body: "Cada pessoa que se cadastrar por ele entra na sua conta. Você não precisa fazer mais nada.",
    hint: "Manda no WhatsApp, cola no Instagram, no que rolar.",
  },
  {
    icon: Sparkles,
    eyebrow: "Passo 2",
    title: "Elas jogam, você ganha",
    body: "Toda vez que alguém que você indicou deposita, uma parte vira sua comissão. Automaticamente.",
    hint: "Sem planilha, sem cálculo. A gente cuida.",
  },
  {
    icon: Wallet,
    eyebrow: "Passo 3",
    title: "Receba quando quiser",
    body: "O dinheiro fica disponível no seu painel. Pediu, cai no Pix em segundos.",
    hint: "Sem taxa. Sem valor mínimo enrolado.",
  },
];

function Onboarding() {
  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const Icon = step.icon;
  const isLast = idx === steps.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold">PalazeHub</span>
          </div>
          <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Pular
          </Link>
        </div>

        {/* progress dots */}
        <div className="mt-10 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i <= idx ? "bg-primary" : "bg-surface-elevated"
              }`}
            />
          ))}
        </div>

        {/* content */}
        <div className="mt-16 flex-1">
          <div className="hero-card relative p-8">
            <div className="hero-glow" />
            <div className="relative">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="eyebrow mt-6">{step.eyebrow}</p>
              <h1 className="font-display mt-2 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                {step.title}
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {step.body}
              </p>
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-secondary/10 px-4 py-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" strokeWidth={2.5} />
                <p className="text-sm text-foreground">{step.hint}</p>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="mt-10 flex items-center gap-3">
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="rounded-xl border border-border bg-transparent px-5 py-3.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Voltar
            </button>
          )}
          {isLast ? (
            <Link
              to="/"
              className="flex-1 rounded-xl bg-primary px-5 py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
            >
              Bora começar
            </Link>
          ) : (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
            >
              Continuar <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
