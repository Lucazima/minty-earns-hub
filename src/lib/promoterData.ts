import { supabase } from "@/integrations/supabase/client";

export type Commission = {
  id: string;
  kind: "commission" | "signup";
  title: string;
  detail: string;
  amount: number;
  occurred_at: string;
};

export type Withdrawal = {
  id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  pix_key: string;
  created_at: string;
  paid_at: string | null;
};

export type Profile = {
  user_id: string;
  display_name: string;
  referral_code: string;
  pix_key: string | null;
};

export type DashboardData = {
  profile: Profile;
  monthEarnings: number;
  monthChangePct: number | null;
  referredCount: number;
  totalDeposited: number;
  available: number;
  recent: Commission[];
};

const DEPOSIT_REGEX = /R\$\s*([\d.,]+)/;

function parseDepositAmount(detail: string): number {
  const m = detail.match(DEPOSIT_REGEX);
  if (!m) return 0;
  return Number(m[1].replace(/\./g, "").replace(",", ".")) || 0;
}

export async function loadDashboard(): Promise<DashboardData> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user!.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [profileRes, commissionsRes, referralsRes, withdrawalsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("commissions").select("*").eq("promoter_id", uid).order("occurred_at", { ascending: false }),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("promoter_id", uid),
    supabase.from("withdrawals").select("amount,status").eq("promoter_id", uid),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (commissionsRes.error) throw commissionsRes.error;
  if (withdrawalsRes.error) throw withdrawalsRes.error;

  const commissions = (commissionsRes.data ?? []) as Commission[];
  const withdrawals = (withdrawalsRes.data ?? []) as Pick<Withdrawal, "amount" | "status">[];

  const monthEarnings = commissions
    .filter((c) => c.occurred_at >= monthStart)
    .reduce((s, c) => s + Number(c.amount), 0);

  const prevMonthEarnings = commissions
    .filter((c) => c.occurred_at >= prevMonthStart && c.occurred_at < monthStart)
    .reduce((s, c) => s + Number(c.amount), 0);

  const monthChangePct =
    prevMonthEarnings > 0 ? ((monthEarnings - prevMonthEarnings) / prevMonthEarnings) * 100 : null;

  const totalEarned = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalWithdrawn = withdrawals
    .filter((w) => w.status !== "failed")
    .reduce((s, w) => s + Number(w.amount), 0);
  const available = Math.max(0, totalEarned - totalWithdrawn);

  const totalDeposited = commissions
    .filter((c) => c.kind === "commission")
    .reduce((s, c) => s + parseDepositAmount(c.detail), 0);

  return {
    profile: profileRes.data as Profile,
    monthEarnings,
    monthChangePct,
    referredCount: referralsRes.count ?? 0,
    totalDeposited,
    available,
    recent: commissions.slice(0, 4),
  };
}

export async function loadCommissions(): Promise<Commission[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user!.id;
  const { data, error } = await supabase
    .from("commissions")
    .select("*")
    .eq("promoter_id", uid)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Commission[];
}

export async function loadWithdrawals(): Promise<Withdrawal[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user!.id;
  const { data, error } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("promoter_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Withdrawal[];
}

export async function requestWithdrawal(amount: number, pixKey: string) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user!.id;
  const { error } = await supabase.from("withdrawals").insert({
    promoter_id: uid,
    amount,
    pix_key: pixKey,
    status: "pending",
  });
  if (error) throw error;
  await supabase.from("profiles").update({ pix_key: pixKey }).eq("user_id", uid);
}

export function groupByDay(items: Commission[]) {
  const now = new Date();
  const todayKey = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const buckets = new Map<string, { day: string; total: number; items: Commission[] }>();
  const order = ["Hoje", "Ontem", "Esta semana", "Anteriores"];
  order.forEach((k) => buckets.set(k, { day: k, total: 0, items: [] }));

  for (const it of items) {
    const d = new Date(it.occurred_at);
    let key = "Anteriores";
    if (d.toDateString() === todayKey) key = "Hoje";
    else if (d.toDateString() === yesterdayKey) key = "Ontem";
    else if (d >= weekAgo) key = "Esta semana";
    const b = buckets.get(key)!;
    b.items.push(it);
    b.total += Number(it.amount);
  }
  return order.map((k) => buckets.get(k)!).filter((b) => b.items.length > 0);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { weekday: "short" }) +
    ", " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
