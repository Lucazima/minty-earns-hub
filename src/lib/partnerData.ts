export type RecentDeposit = { date: string; player: string; amount: number };

export type Promoter = {
  id: string;
  name: string;
  handle: string;
  tier: "Diamante" | "Ouro" | "Prata" | "Novato";
  status: "ativo" | "pausado" | "revisar";
  referred: number;
  activePlayers: number;
  depositsMTD: number;
  ngrMTD: number;
  commissionDue: number;
  joinedAt: string;
  lastActivity: string;
};

// Deterministic mock history for sparkline (last 6 months, older → newer).
export const depositsHistory = (p: Promoter): number[] => {
  const base = p.depositsMTD;
  const seed = p.id.charCodeAt(2) || 3;
  const factors = [0.62, 0.71, 0.83, 0.79, 0.92, 1];
  return factors.map((f, i) => Math.round(base * f * (0.9 + ((seed + i) % 5) * 0.04)));
};

const firstNames = ["Lucas", "Ana", "Bruno", "Júlia", "Rafael", "Sofia", "Enzo", "Helena"];
export const recentDepositsFor = (p: Promoter): RecentDeposit[] => {
  const seed = p.id.charCodeAt(3) || 5;
  const today = new Date("2026-11-18");
  return Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2 - (seed % 3));
    const amount = Math.round(((p.depositsMTD / Math.max(p.activePlayers, 4)) * (0.6 + ((seed + i) % 7) * 0.12)) / 10) * 10;
    return {
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      player: `${firstNames[(seed + i) % firstNames.length]} ${String.fromCharCode(65 + ((seed + i * 3) % 26))}.`,
      amount,
    };
  });
};

export const promoters: Promoter[] = [
  { id: "p_001", name: "Marina Rocha",   handle: "@marina.bet",   tier: "Diamante", status: "ativo",    referred: 342, activePlayers: 214, depositsMTD: 184200, ngrMTD: 48250, commissionDue: 12060, joinedAt: "2024-03-11", lastActivity: "há 8 min" },
  { id: "p_002", name: "Diego Fontes",   handle: "@diegofx",      tier: "Ouro",     status: "ativo",    referred: 187, activePlayers: 121, depositsMTD:  92100, ngrMTD: 22110, commissionDue:  5528, joinedAt: "2024-05-02", lastActivity: "há 32 min" },
  { id: "p_003", name: "Camila Prado",   handle: "@camipromo",    tier: "Ouro",     status: "ativo",    referred: 156, activePlayers:  98, depositsMTD:  71340, ngrMTD: 17840, commissionDue:  4460, joinedAt: "2024-06-19", lastActivity: "há 2 h" },
  { id: "p_004", name: "Rafael Aquino",  handle: "@aquinotips",   tier: "Prata",    status: "revisar",  referred:  84, activePlayers:  41, depositsMTD:  28400, ngrMTD:  5120, commissionDue:  1280, joinedAt: "2025-01-08", lastActivity: "há 3 dias" },
  { id: "p_005", name: "Bianca Nery",    handle: "@bianery",      tier: "Prata",    status: "ativo",    referred:  71, activePlayers:  39, depositsMTD:  24980, ngrMTD:  4830, commissionDue:  1208, joinedAt: "2025-02-14", lastActivity: "há 1 h" },
  { id: "p_006", name: "Thiago Menezes", handle: "@thiagom",      tier: "Ouro",     status: "ativo",    referred: 129, activePlayers:  74, depositsMTD:  58700, ngrMTD: 13200, commissionDue:  3300, joinedAt: "2024-08-03", lastActivity: "há 20 min" },
  { id: "p_007", name: "Aline Duarte",   handle: "@alineduarte",  tier: "Novato",   status: "ativo",    referred:  22, activePlayers:  11, depositsMTD:   7420, ngrMTD:  1450, commissionDue:   362, joinedAt: "2026-05-30", lastActivity: "há 4 h" },
  { id: "p_008", name: "Pedro Sales",    handle: "@pedrosales",   tier: "Prata",    status: "pausado",  referred:  63, activePlayers:  18, depositsMTD:   9820, ngrMTD:  1980, commissionDue:   495, joinedAt: "2025-04-21", lastActivity: "há 12 dias" },
  { id: "p_009", name: "Larissa Kaur",   handle: "@lari.k",       tier: "Diamante", status: "ativo",    referred: 298, activePlayers: 197, depositsMTD: 162800, ngrMTD: 41200, commissionDue: 10300, joinedAt: "2024-02-04", lastActivity: "há 12 min" },
  { id: "p_010", name: "Vinícius Braga", handle: "@vinibraga",    tier: "Ouro",     status: "ativo",    referred: 142, activePlayers:  81, depositsMTD:  61240, ngrMTD: 14680, commissionDue:  3670, joinedAt: "2024-07-15", lastActivity: "há 45 min" },
];

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const tierClass: Record<Promoter["tier"], string> = {
  Diamante: "bg-primary/15 text-primary ring-primary/25",
  Ouro:     "bg-warning/15 text-warning ring-warning/25",
  Prata:    "bg-secondary/15 text-secondary ring-secondary/25",
  Novato:   "bg-muted text-muted-foreground ring-border",
};

export const statusClass: Record<Promoter["status"], string> = {
  ativo:    "bg-primary/12 text-primary",
  pausado:  "bg-muted text-muted-foreground",
  revisar:  "bg-warning/15 text-warning",
};

export const statusLabel: Record<Promoter["status"], string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  revisar: "Revisar",
};
