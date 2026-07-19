import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

const AUTOPLAY_MS = 6000;

function Onboarding() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const step = steps[idx];
  const Icon = step.icon;
  const isLast = idx === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      navigate({ to: "/" });
    } else {
      setIdx((i) => i + 1);
    }
  };
  const goPrev = () => setIdx((i) => Math.max(0, i - 1));

  // Autoplay progress
  useEffect(() => {
    setProgress(0);
    if (reducedMotion || paused) return;
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / AUTOPLAY_MS);
      setProgress(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        goNext();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, reducedMotion]);

  const handleTap = (side: "left" | "right") => {
    setPaused(true);
    if (side === "right") goNext();
    else goPrev();
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Tap zones — full-height, behind interactive content */}
      <button
        aria-label="Passo anterior"
        onClick={() => handleTap("left")}
        className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-default focus:outline-none"
      />
      <button
        aria-label="Próximo passo"
        onClick={() => handleTap("right")}
        className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-default focus:outline-none"
      />

      <div className="relative z-20 mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8 pointer-events-none">
        {/* header */}
        <div className="flex items-center justify-between pointer-events-auto">
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

        {/* progress bars — story style */}
        <div className="mt-10 flex items-center gap-1.5 pointer-events-none">
          {steps.map((_, i) => {
            const fill = i < idx ? 1 : i === idx ? progress : 0;
            return (
              <div
                key={i}
                className="h-1 flex-1 overflow-hidden rounded-full bg-surface-elevated"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${fill * 100}%`,
                    transition: reducedMotion ? "none" : "width 80ms linear",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* content */}
        <div className="mt-16 flex-1 pointer-events-none">
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
        <div className="mt-10 flex items-center gap-3 pointer-events-auto">
          {idx > 0 && (
            <button
              onClick={() => { setPaused(true); goPrev(); }}
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
              onClick={() => { setPaused(true); goNext(); }}
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
