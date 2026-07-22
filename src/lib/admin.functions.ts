import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------- helpers --------
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

async function auditLog(
  ctx: { supabase: any; userId: string },
  action: string,
  entity: string,
  entity_id: string,
  reason = "",
  meta: Record<string, unknown> = {},
) {
  await ctx.supabase.from("audit_log").insert({
    actor_id: ctx.userId,
    action,
    entity,
    entity_id,
    reason,
    meta,
  });
}

const parseDepositAmount = (detail: string): number => {
  const m = detail.match(/R\$\s*([\d.,]+)/);
  if (!m) return 0;
  return Number(m[1].replace(/\./g, "").replace(",", ".")) || 0;
};

// -------- overview --------
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [profilesRes, commsRes, payoutsRes] = await Promise.all([
      sb.from("profiles").select("user_id, display_name, tier, status, created_at, email"),
      sb.from("commissions").select("promoter_id, amount, detail, kind, status, occurred_at, created_at"),
      sb.from("withdrawals").select("id, amount, status, created_at, promoter_id"),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (commsRes.error) throw commsRes.error;
    if (payoutsRes.error) throw payoutsRes.error;

    const profiles = profilesRes.data ?? [];
    const commissions = commsRes.data ?? [];
    const payouts = payoutsRes.data ?? [];

    const activePromoters = profiles.filter((p: any) => p.status === "active").length;
    const pendingPromoters = profiles.filter((p: any) => p.status === "pending").length;
    const turnoverMonth = commissions
      .filter((c: any) => c.occurred_at >= monthStart && c.kind === "commission")
      .reduce((s: number, c: any) => s + parseDepositAmount(c.detail), 0);
    const commissionsPending = commissions
      .filter((c: any) => c.status === "pending")
      .reduce((s: number, c: any) => s + Number(c.amount), 0);
    const payoutsPending = payouts
      .filter((w: any) => w.status === "pending")
      .reduce((s: number, w: any) => s + Number(w.amount), 0);
    const payoutsPendingCount = payouts.filter((w: any) => w.status === "pending").length;

    // 30d growth series
    const days: { date: string; promoters: number; volume: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, promoters: 0, volume: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));
    profiles.forEach((p: any) => {
      const k = (p.created_at as string).slice(0, 10);
      const b = dayMap.get(k);
      if (b) b.promoters += 1;
    });
    commissions
      .filter((c: any) => c.occurred_at >= thirtyDaysAgo && c.kind === "commission")
      .forEach((c: any) => {
        const k = (c.occurred_at as string).slice(0, 10);
        const b = dayMap.get(k);
        if (b) b.volume += parseDepositAmount(c.detail);
      });

    // Top performers (by month turnover)
    const perPromoter = new Map<string, number>();
    commissions
      .filter((c: any) => c.occurred_at >= monthStart && c.kind === "commission")
      .forEach((c: any) => {
        perPromoter.set(
          c.promoter_id,
          (perPromoter.get(c.promoter_id) ?? 0) + parseDepositAmount(c.detail),
        );
      });
    const nameOf = new Map(profiles.map((p: any) => [p.user_id, p.display_name]));
    const tierOf = new Map(profiles.map((p: any) => [p.user_id, p.tier]));
    const topPerformers = Array.from(perPromoter.entries())
      .map(([id, volume]) => ({
        id,
        name: (nameOf.get(id) as string) ?? "Promotor",
        tier: (tierOf.get(id) as string) ?? "novato",
        volume,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // Alerts
    const alerts: { kind: string; message: string; severity: "warn" | "info" | "alert" }[] = [];
    if (pendingPromoters > 0)
      alerts.push({
        kind: "pending_promoters",
        severity: "warn",
        message: `${pendingPromoters} promoter${pendingPromoters > 1 ? "es" : ""} aguardando aprovação`,
      });
    const oldPayouts = payouts.filter(
      (w: any) => w.status === "pending" && w.created_at < sevenDaysAgo,
    );
    if (oldPayouts.length > 0)
      alerts.push({
        kind: "old_payouts",
        severity: "alert",
        message: `${oldPayouts.length} solicitação${oldPayouts.length > 1 ? "ões" : ""} de saque com mais de 7 dias`,
      });
    // suspicious: promoter with volume > 3x the average
    const volumes = Array.from(perPromoter.values());
    if (volumes.length >= 3) {
      const avg = volumes.reduce((s, v) => s + v, 0) / volumes.length;
      const outliers = Array.from(perPromoter.entries()).filter(([, v]) => v > avg * 3);
      if (outliers.length > 0)
        alerts.push({
          kind: "suspicious",
          severity: "info",
          message: `${outliers.length} promotor com volume muito acima da média — revisar atividade`,
        });
    }

    return {
      kpis: {
        activePromoters,
        pendingPromoters,
        turnoverMonth,
        commissionsPending,
        payoutsPending,
        payoutsPendingCount,
      },
      growth: days,
      topPerformers,
      alerts,
    };
  });

// -------- promoters --------
export const listPromoters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { search?: string; status?: string; tier?: string }) => d ?? {},
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    const [profilesRes, commsRes, referralsRes] = await Promise.all([
      sb.from("profiles").select("user_id, display_name, email, referral_code, tier, status, created_at, admin_notes"),
      sb.from("commissions").select("promoter_id, amount, detail, kind"),
      sb.from("referrals").select("promoter_id"),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (commsRes.error) throw commsRes.error;
    if (referralsRes.error) throw referralsRes.error;

    const volumeByPromoter = new Map<string, number>();
    const earnByPromoter = new Map<string, number>();
    (commsRes.data ?? []).forEach((c: any) => {
      if (c.kind === "commission") {
        volumeByPromoter.set(
          c.promoter_id,
          (volumeByPromoter.get(c.promoter_id) ?? 0) + parseDepositAmount(c.detail),
        );
      }
      earnByPromoter.set(
        c.promoter_id,
        (earnByPromoter.get(c.promoter_id) ?? 0) + Number(c.amount),
      );
    });
    const refByPromoter = new Map<string, number>();
    (referralsRes.data ?? []).forEach((r: any) => {
      refByPromoter.set(r.promoter_id, (refByPromoter.get(r.promoter_id) ?? 0) + 1);
    });

    let rows = (profilesRes.data ?? []).map((p: any) => ({
      ...p,
      volume: volumeByPromoter.get(p.user_id) ?? 0,
      earnings: earnByPromoter.get(p.user_id) ?? 0,
      referrals: refByPromoter.get(p.user_id) ?? 0,
    }));

    if (data.search) {
      const q = data.search.toLowerCase();
      rows = rows.filter(
        (r: any) =>
          (r.display_name ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q) ||
          (r.referral_code ?? "").toLowerCase().includes(q),
      );
    }
    if (data.status && data.status !== "all") rows = rows.filter((r: any) => r.status === data.status);
    if (data.tier && data.tier !== "all") rows = rows.filter((r: any) => r.tier === data.tier);

    rows.sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1));
    return rows;
  });

export const getPromoterDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [profileRes, referralsRes, commsRes, withdrawalsRes] = await Promise.all([
      sb.from("profiles").select("*").eq("user_id", data.id).maybeSingle(),
      sb.from("referrals").select("*").eq("promoter_id", data.id).order("created_at", { ascending: false }),
      sb.from("commissions").select("*").eq("promoter_id", data.id).order("occurred_at", { ascending: false }),
      sb.from("withdrawals").select("*").eq("promoter_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (profileRes.error) throw profileRes.error;
    return {
      profile: profileRes.data,
      referrals: referralsRes.data ?? [],
      commissions: commsRes.data ?? [],
      withdrawals: withdrawalsRes.data ?? [],
    };
  });

export const updatePromoterStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; reason?: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ status: data.status as any })
      .eq("user_id", data.id);
    if (error) throw error;
    await auditLog(context, "promoter.status", "profile", data.id, data.reason ?? "", {
      status: data.status,
    });
    return { ok: true };
  });

export const updatePromoterTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; tier: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ tier: data.tier as any })
      .eq("user_id", data.id);
    if (error) throw error;
    await auditLog(context, "promoter.tier", "profile", data.id, "", { tier: data.tier });
    return { ok: true };
  });

export const updatePromoterNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; notes: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ admin_notes: data.notes })
      .eq("user_id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// -------- commissions --------
export const listCommissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; promoterId?: string; from?: string; to?: string }) => d ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [commsRes, profilesRes] = await Promise.all([
      sb.from("commissions").select("*").order("occurred_at", { ascending: false }).limit(500),
      sb.from("profiles").select("user_id, display_name"),
    ]);
    if (commsRes.error) throw commsRes.error;
    const nameOf = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p.display_name]));
    let rows = (commsRes.data ?? []).map((c: any) => ({
      ...c,
      promoter_name: (nameOf.get(c.promoter_id) as string) ?? "—",
    }));
    if (data.status && data.status !== "all") rows = rows.filter((r: any) => r.status === data.status);
    if (data.promoterId) rows = rows.filter((r: any) => r.promoter_id === data.promoterId);
    if (data.from) rows = rows.filter((r: any) => r.occurred_at >= data.from!);
    if (data.to) rows = rows.filter((r: any) => r.occurred_at <= data.to!);
    return rows;
  });

export const updateCommissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" | "pending"; reason?: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("commissions")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    await auditLog(context, "commission.status", "commission", data.id, data.reason ?? "", {
      status: data.status,
    });
    return { ok: true };
  });

export const editCommissionAmount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; amount: number; reason: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (!data.reason || data.reason.trim().length < 3)
      throw new Error("Motivo é obrigatório");
    const { error } = await context.supabase
      .from("commissions")
      .update({ amount: data.amount, edit_reason: data.reason })
      .eq("id", data.id);
    if (error) throw error;
    await auditLog(context, "commission.edit", "commission", data.id, data.reason, {
      amount: data.amount,
    });
    return { ok: true };
  });

export const getCommissionRates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("commission_rates")
      .select("*")
      .order("tier");
    if (error) throw error;
    return data ?? [];
  });

export const updateCommissionRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tier: string; percent: number }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("commission_rates")
      .update({ percent: data.percent, updated_at: new Date().toISOString() })
      .eq("tier", data.tier);
    if (error) throw error;
    await auditLog(context, "rate.update", "commission_rate", data.tier, "", { percent: data.percent });
    return { ok: true };
  });

// -------- payouts --------
export const listPayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string }) => d ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [payoutsRes, profilesRes] = await Promise.all([
      sb.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(500),
      sb.from("profiles").select("user_id, display_name, email"),
    ]);
    if (payoutsRes.error) throw payoutsRes.error;
    const profMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p]));
    let rows = (payoutsRes.data ?? []).map((w: any) => {
      const p = profMap.get(w.promoter_id) as any;
      return {
        ...w,
        promoter_name: p?.display_name ?? "—",
        promoter_email: p?.email ?? "",
      };
    });
    if (data.status && data.status !== "all") rows = rows.filter((r: any) => r.status === data.status);
    return rows;
  });

export const approvePayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (!data.ids.length) return { ok: true, count: 0 };
    const { error } = await context.supabase
      .from("withdrawals")
      .update({ status: "paid", paid_at: new Date().toISOString(), processed_by: context.userId })
      .in("id", data.ids);
    if (error) throw error;
    for (const id of data.ids) {
      await auditLog(context, "payout.approve", "withdrawal", id, "", {});
    }
    return { ok: true, count: data.ids.length };
  });

export const rejectPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (!data.reason || data.reason.trim().length < 3)
      throw new Error("Motivo é obrigatório");
    const { error } = await context.supabase
      .from("withdrawals")
      .update({
        status: "rejected",
        rejection_reason: data.reason,
        processed_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw error;
    await auditLog(context, "payout.reject", "withdrawal", data.id, data.reason, {});
    return { ok: true };
  });

export const getPlatformSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("platform_settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    if (error) throw error;
    return row?.value ?? null;
  });

export const setPlatformSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("platform_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw error;
    await auditLog(context, "setting.update", "platform_setting", data.key, "", { value: data.value });
    return { ok: true };
  });

// -------- partners --------
export const listPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      name: string;
      contact_email?: string;
      contact_phone?: string;
      commission_rate: number;
      webhook_url?: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    // generate api key (shown once), store sha256 hash
    const rawKey = "phk_" + crypto.randomUUID().replace(/-/g, "");
    const enc = new TextEncoder().encode(rawKey);
    const hashBuf = await crypto.subtle.digest("SHA-256", enc);
    const hash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { data: row, error } = await context.supabase
      .from("partners")
      .insert({
        name: data.name,
        contact_email: data.contact_email ?? "",
        contact_phone: data.contact_phone ?? "",
        commission_rate: data.commission_rate,
        webhook_url: data.webhook_url ?? "",
        api_key_hash: hash,
        status: "active",
      })
      .select()
      .single();
    if (error) throw error;
    await auditLog(context, "partner.create", "partner", row.id, "", { name: data.name });
    return { partner: row, apiKey: rawKey };
  });

export const updatePartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      name?: string;
      contact_email?: string;
      contact_phone?: string;
      commission_rate?: number;
      webhook_url?: string;
      status?: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("partners").update(patch).eq("id", id);
    if (error) throw error;
    await auditLog(context, "partner.update", "partner", id, "", patch);
    return { ok: true };
  });

// -------- is admin check for UI --------
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });
