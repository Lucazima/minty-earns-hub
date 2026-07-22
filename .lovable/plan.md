# Admin Panel — PalazeHub

Painel interno de administração em `/admin`, gated por role `admin`, reutilizando o design system do promoter (dark #0A0E1A + mint #00E28A + roxo #6C5CE7, Space Grotesk display, cards 16px, CountUp nos valores). Tom sério, dados densos com hierarquia — é o "cockpit" da operação.

## Escopo (MVP funcional, dados reais no Supabase)

### 1. Backend — schema e roles
Migração única adicionando:
- Enum `app_role` (`admin`, `promoter`) + tabela `user_roles` + função `has_role()` security definer (padrão anti-recursão).
- Enum `commission_tier` (`novato`, `prata`, `ouro`, `diamante`).
- Colunas em `profiles`: `status` (`pending`/`active`/`suspended`/`banned`), `tier`, `admin_notes` (text), `email` (snapshot).
- Colunas em `commissions`: `status` (`pending`/`approved`/`rejected`/`paid`), `source_ref` (texto/ID do depósito), `edit_reason`.
- Colunas em `withdrawals`: `rejection_reason`, `processed_by`, mantém `status` (`pending`/`processing`/`paid`/`rejected`).
- Nova tabela `partners`: nome, contato, taxa acordada, webhook URL, api_key hash, status.
- Nova tabela `commission_rates`: tier → percentual (linha por tier).
- Nova tabela `platform_settings`: chave/valor (ex: `min_withdrawal_amount`).
- Nova tabela `audit_log`: quem/quando/ação/entidade/motivo (para edições de comissão, aprovação/recusa, mudança de tier).
- RLS: tudo bloqueado exceto `has_role(auth.uid(),'admin')` para as tabelas admin; policies existentes de promoter continuam.
- Trigger `handle_new_user` atualizado: novo promoter entra como `status='pending'`, tier `novato`.
- Seed do primeiro admin: instrução para o usuário rodar SQL de promoção após criar sua conta (mostraremos o comando no chat).

### 2. Rotas (novo grupo `_admin`)
Layout `src/routes/_admin/route.tsx` com gate: `has_role(user,'admin')` → senão redirect `/`. Shell próprio `AdminShell` (mesmo design do PartnerShell mas com badge "Admin" roxo).

Telas:
- `/admin` — **Dashboard executivo**: KPIs (promoters ativos, turnover mês, comissões pendentes, payouts aguardando), gráfico SVG de crescimento (novos promoters + volume 30d), lista de alertas (pending approvals, payouts >7d, atividade suspeita = volume anormal), top 5 performers.
- `/admin/promoters` — lista com busca, filtros (status, tier, período, faixa de volume), ações inline (aprovar/rejeitar em `pending`).
- `/admin/promoters/$id` — detalhe: perfil, tier editável, status (suspender/banir/reativar), histórico completo (referrals, depósitos agregados, comissões, payouts), campo `admin_notes` com save.
- `/admin/commissions` — tabela filtrada (período/promoter/status), ações aprovar/rejeitar, editar valor (modal exige motivo → grava em `audit_log`), coluna "origem" mostra `source_ref`.
- `/admin/commissions/rates` — configurar % por tier (form simples).
- `/admin/payouts` — fila pendente com checkbox de seleção múltipla → aprovar em lote / recusar individual (motivo obrigatório). Aba "Histórico" para pagos/recusados. Config de valor mínimo.
- `/admin/partners` — CRUD de parceiros (BetSul etc), form com nome/contato/taxa/webhook/api_key (gerada), toggle status. Card de performance por parceiro (promoters vinculados, volume, comissão).

### 3. Server functions
`src/lib/admin.functions.ts` (com `requireSupabaseAuth` + checagem de role via `context.supabase.rpc('has_role',...)`):
- `listPromoters`, `getPromoterDetail`, `updatePromoterStatus`, `updatePromoterTier`, `updatePromoterNotes`
- `listCommissions`, `updateCommissionStatus`, `editCommissionAmount` (grava audit_log)
- `getCommissionRates`, `updateCommissionRate`
- `listPayouts`, `approvePayouts` (bulk), `rejectPayout`, `getMinWithdrawal`, `setMinWithdrawal`
- `listPartners`, `createPartner`, `updatePartner`, `getPartnerPerformance`
- `getAdminOverview` (KPIs + série temporal + alertas + top performers)

Todas usam `useServerFn` + TanStack Query no cliente, com `invalidateQueries` após mutações e `toast` sonner de feedback.

### 4. Navegação e link entre portais
`AppShell` (promoter) e `PartnerShell` ganham link "Admin" visível apenas quando `has_role='admin'` (hook `useIsAdmin`). `AdminShell` tem links recíprocos para "Ver como promotor" / "Portal do parceiro".

### 5. O que **não** faz parte deste MVP (fora de escopo, ficam mockados/UI-only)
- Integração real Pagar.me (payout marca como `paid` manualmente, sem chamada externa).
- Recepção real de webhook de turnover (endpoint criado stub em `/api/public/webhooks/turnover` com verificação de HMAC, mas sem parceiro real conectado).
- Detecção automática de "atividade suspeita" (regra simples heurística: promoter com >3x volume médio da semana).
- Gerar api_key real (armazenamos hash sha256 de string aleatória mostrada uma única vez ao criar).

## Detalhes técnicos

**Roles**: padrão Lovable — enum + `user_roles` + `has_role()` SECURITY DEFINER. Nunca guardar role em `profiles`. Primeiro admin promovido via SQL manual (mostrar comando ao usuário após migração).

**Arquitetura de rotas**: `src/routes/_admin/route.tsx` layout com `ssr: false` + `beforeLoad` que valida sessão E role. Filhos: `_admin/index.tsx`, `_admin/promoters.index.tsx`, `_admin/promoters.$id.tsx`, `_admin/commissions.index.tsx`, `_admin/commissions.rates.tsx`, `_admin/payouts.tsx`, `_admin/partners.tsx`.

**Server fns**: pattern `createServerFn().middleware([requireSupabaseAuth]).handler(async ({ context }) => { const isAdmin = await context.supabase.rpc('has_role',{...}); if(!isAdmin) throw new Error('Forbidden'); ... })`. Uso de `context.supabase` (RLS) para reads; `supabaseAdmin` (import dinâmico) apenas para operações que precisam bypass (ex: listar profiles cruzando com auth.users email).

**Design**: reutiliza tokens de `styles.css`, componentes `CountUp`, `AppShell`-style. AdminShell com header roxo sutil (`bg-secondary/10` badge) para diferenciar visualmente sem quebrar identidade.

**Ordem de execução**:
1. Migração (schema + roles + seed rates + settings).
2. Server functions.
3. Layout `_admin` + shell.
4. Telas na ordem: overview → promoters → commissions → payouts → partners.
5. Links entre portais + hook `useIsAdmin`.
6. Testar fluxos com Playwright.

Confirma para prosseguir?
