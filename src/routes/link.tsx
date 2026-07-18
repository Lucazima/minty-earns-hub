import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, MessageCircle, Share2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/link")({
  head: () => ({
    meta: [
      { title: "Meu link — PalazeHub" },
      { name: "description", content: "Copie seu link de indicação e materiais prontos pra compartilhar." },
    ],
  }),
  component: MyLink,
});

const referralUrl = "palaze.bet/m/marina";

function MyLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${referralUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const messages = [
    "Achei uma plataforma boa pra apostar, dá uma olhada:",
    "Se cadastra por aqui que rola bônus, testei e curti:",
    "Tá afim de testar? Usa meu link:",
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="eyebrow">Seu link pessoal</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Compartilhe e comece a ganhar.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Toda pessoa que se cadastrar por esse link entra na sua conta. Você recebe uma parte do que ela depositar.
          </p>
        </div>

        {/* Link card */}
        <section className="surface-card p-5 md:p-6">
          <span className="eyebrow">Seu link</span>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-4 py-3.5">
              <p className="truncate font-display text-lg font-semibold text-foreground">
                {referralUrl}
              </p>
            </div>
            <button
              onClick={copy}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition active:scale-[0.98] ${
                copied
                  ? "bg-primary/20 text-primary"
                  : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110"
              }`}
            >
              {copied ? <><Check className="h-4 w-4" strokeWidth={2.5}/> Copiado!</> : <><Copy className="h-4 w-4" strokeWidth={2.5}/> Copiar meu link</>}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <ShareBtn icon={<MessageCircle className="h-4 w-4"/>} label="WhatsApp" />
            <ShareBtn icon={<Share2 className="h-4 w-4"/>} label="Instagram" />
            <ShareBtn icon={<Share2 className="h-4 w-4"/>} label="Telegram" />
          </div>
        </section>

        {/* Ready messages */}
        <section>
          <h2 className="font-display text-xl font-semibold">Textos prontos pra mandar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Copie um e cole no chat. Simples assim.</p>

          <div className="mt-4 grid gap-3">
            {messages.map((m, i) => (
              <ReadyMessage key={i} text={`${m} https://${referralUrl}`} />
            ))}
          </div>
        </section>

        {/* Banners */}
        <section>
          <h2 className="font-display text-xl font-semibold">Imagens pra postar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Prontas pro Stories e feed.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: "Stories", size: "9:16" },
              { label: "Post quadrado", size: "1:1" },
              { label: "Feed vertical", size: "4:5" },
            ].map((b) => (
              <div key={b.label} className="surface-card group overflow-hidden">
                <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden"
                     style={{ background: "var(--gradient-hero)" }}>
                  <ImageIcon className="h-8 w-8 text-foreground/40" />
                  <div className="absolute bottom-3 left-3 rounded-md bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                    {b.size}
                  </div>
                </div>
                <button className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface-elevated">
                  <Download className="h-4 w-4"/> {b.label}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ShareBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-surface/60 px-3 py-3 text-xs font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground">
      <span className="text-secondary">{icon}</span>
      {label}
    </button>
  );
}

function ReadyMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <div className="surface-card flex items-start gap-4 p-4">
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">{text}</p>
      <button
        onClick={copy}
        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          copied ? "bg-primary/20 text-primary" : "bg-secondary/15 text-secondary hover:bg-secondary/25"
        }`}
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
