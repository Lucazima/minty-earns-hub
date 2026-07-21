import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — PalazeHub" },
      { name: "description", content: "Entre na sua conta de promotor." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu dessa vez, tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">PalazeHub</span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {mode === "signin" ? "Bem-vindo de volta." : "Comece a ganhar."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Entre pra ver seus ganhos."
            : "Crie sua conta em segundos."}
        </p>

        <form onSubmit={onSubmit} className="surface-card mt-8 space-y-4 p-5 md:p-6">
          {mode === "signup" && (
            <div>
              <label className="eyebrow" htmlFor="name">Como te chamamos?</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none focus:border-primary/60"
                placeholder="Marina"
              />
            </div>
          )}
          <div>
            <label className="eyebrow" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none focus:border-primary/60"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="eyebrow" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none focus:border-primary/60"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Um instante…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "Ainda não tem conta? Criar agora"
            : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
