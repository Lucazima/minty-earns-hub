import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, User, Lock, Share2, Loader2, Instagram, Facebook, Twitter, Send, AtSign } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — PalazeHub" },
      { name: "description", content: "Atualize sua foto, dados pessoais, senha e redes sociais." },
    ],
  }),
  component: MinhaContaPage,
});

type Profile = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  threads: string | null;
  telegram: string | null;
};

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

async function loadAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function MinhaContaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Sessão expirada.");
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      const p = (profile ?? { user_id: user.id }) as unknown as Profile;
      const signed = await loadAvatarUrl(p.avatar_url);
      return { profile: { ...p, email: p.email ?? user.email ?? null }, avatarPreview: signed, userId: user.id };
    },
  });

  if (isLoading || !data) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-surface" />
          <div className="surface-card h-40 animate-pulse" />
          <div className="surface-card h-64 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <p className="eyebrow">Sua conta</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">Minha conta</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Atualize sua foto, dados e como as pessoas te encontram.
          </p>
        </header>

        <AvatarSection profile={data.profile} avatarPreview={data.avatarPreview} userId={data.userId} onSaved={() => qc.invalidateQueries({ queryKey: ["me-profile"] })} />
        <PersonalSection profile={data.profile} onSaved={() => qc.invalidateQueries({ queryKey: ["me-profile"] })} />
        <SecuritySection />
        <SocialSection profile={data.profile} onSaved={() => qc.invalidateQueries({ queryKey: ["me-profile"] })} />
      </div>
    </AppShell>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/15 text-secondary">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="eyebrow">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none focus:border-primary/60";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60";

function AvatarSection({ profile, avatarPreview, userId, onSaved }: { profile: Profile; avatarPreview: string | null; userId: string; onSaved: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarPreview);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setPreview(avatarPreview), [avatarPreview]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: path } as never).eq("user_id", userId);
      if (updErr) throw updErr;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
      setPreview(data?.signedUrl ?? null);
      toast.success("Foto atualizada!");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu pra enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <SectionCard icon={<Camera className="h-4 w-4" strokeWidth={2} />} title="Foto de perfil" subtitle="É como as pessoas vão te reconhecer.">
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border/60 bg-surface-elevated">
          {preview ? (
            <img src={preview} alt="Sua foto" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-semibold text-muted-foreground">
              {initials(profile.display_name)}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={btnPrimary}>
            {uploading ? "Enviando…" : "Alterar foto"}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">JPG, PNG ou WEBP · até 2MB</p>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
        </div>
      </div>
    </SectionCard>
  );
}

function PersonalSection({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [name, setName] = useState(profile.display_name ?? "");
  const [phone, setPhone] = useState(maskPhone(profile.phone ?? ""));
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Coloca seu nome.");
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), phone: phone.replace(/\D/g, "") || null } as never)
        .eq("user_id", profile.user_id);
      if (error) throw error;
      toast.success("Dados salvos.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não rolou salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard icon={<User className="h-4 w-4" strokeWidth={2} />} title="Dados pessoais" subtitle="Como te chamamos e como falar com você.">
      <form onSubmit={save} className="space-y-4">
        <Field label="Nome completo">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </Field>
        <Field label="Telefone">
          <input className={inputCls} value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" inputMode="tel" />
        </Field>
        <Field label="E-mail">
          <div className="rounded-xl border border-border/60 bg-surface/40 px-4 py-3 text-base text-muted-foreground">
            {profile.email ?? "—"}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Pra alterar o e-mail, fale com o suporte.</p>
        </Field>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
    if (next !== confirm) return toast.error("A confirmação não bate com a nova senha.");
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error("Sessão expirada.");
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signErr) throw new Error("Senha atual incorreta.");
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Senha alterada!");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu pra trocar a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard icon={<Lock className="h-4 w-4" strokeWidth={2} />} title="Segurança" subtitle="Troque sua senha quando quiser.">
      <form onSubmit={save} className="space-y-4">
        <Field label="Senha atual">
          <input type="password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="Nova senha">
          <input type="password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} placeholder="Mínimo 8 caracteres" />
        </Field>
        <Field label="Confirmar nova senha">
          <input type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Alterando…" : "Alterar senha"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function SocialSection({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [instagram, setInstagram] = useState(profile.instagram ?? "");
  const [facebook, setFacebook] = useState(profile.facebook ?? "");
  const [twitter, setTwitter] = useState(profile.twitter ?? "");
  const [threads, setThreads] = useState(profile.threads ?? "");
  const [telegram, setTelegram] = useState(profile.telegram ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          twitter: twitter.trim() || null,
          threads: threads.trim() || null,
          telegram: telegram.trim() || null,
        } as never)
        .eq("user_id", profile.user_id);
      if (error) throw error;
      toast.success("Redes atualizadas.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não rolou salvar.");
    } finally {
      setSaving(false);
    }
  }

  const rows: Array<{ label: string; icon: React.ReactNode; value: string; set: (v: string) => void; placeholder: string }> = [
    { label: "Instagram", icon: <Instagram className="h-4 w-4" />, value: instagram, set: setInstagram, placeholder: "@seuusuario" },
    { label: "Facebook", icon: <Facebook className="h-4 w-4" />, value: facebook, set: setFacebook, placeholder: "facebook.com/voce" },
    { label: "X / Twitter", icon: <Twitter className="h-4 w-4" />, value: twitter, set: setTwitter, placeholder: "@seuusuario" },
    { label: "Threads", icon: <AtSign className="h-4 w-4" />, value: threads, set: setThreads, placeholder: "@seuusuario" },
    { label: "Telegram", icon: <Send className="h-4 w-4" />, value: telegram, set: setTelegram, placeholder: "@seuusuario" },
  ];

  return (
    <SectionCard icon={<Share2 className="h-4 w-4" strokeWidth={2} />} title="Redes sociais" subtitle="Todos os campos são opcionais.">
      <form onSubmit={save} className="space-y-4">
        {rows.map((r) => (
          <Field key={r.label} label={r.label}>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 focus-within:border-primary/60">
              <span className="text-muted-foreground">{r.icon}</span>
              <input
                className="w-full bg-transparent py-3 text-base outline-none"
                value={r.value}
                onChange={(e) => r.set(e.target.value)}
                placeholder={r.placeholder}
              />
            </div>
          </Field>
        ))}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
