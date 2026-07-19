## Diagnóstico

Ao revisar `parceiro.tsx`, `parceiro.promotores.tsx`, `parceiro.depositos.tsx`, `parceiro.pagamentos.tsx` e `PartnerShell.tsx`, encontrei estes pontos que hoje não respondem ao clique ou parecem prometer algo que não existe:

1. **Não há entrada para o portal da operadora** no shell do promotor (`AppShell`). O único caminho para `/parceiro` é digitar a URL — nem promotor nem parceiro veem um botão para trocar de contexto.
2. **Linhas da tabela de Promotores** parecem clicáveis (hover, avatar, nome), mas não há detalhe/drawer — não há rota `/parceiro/promotores/$id`.
3. **Sem ações por promotor**: não dá para pausar, mensagem, revisar KYC ou copiar o link dele. O ícone `AlertTriangle` sugere "precisa revisar" mas não abre nada.
4. **Toolbar de promotores** sem "Limpar filtros" e sem estado vazio acionável.
5. **Card "Precisa contestar um valor?"** (em `/parceiro/pagamentos`) descreve fluxo que não existe — nenhum campo de nota, nenhum botão.
6. **Sidebar do PartnerShell** com link "parceiros@palazehub.com" mas sem link de voltar para o Painel do Promotor; no mobile, a bottom-nav de 4 itens tem labels que quebram em telas estreitas.
7. **`/parceiro/depositos`**: seletor de período (MTD/30d/90d) só multiplica valores mock — funciona visualmente, mas o botão "Exportar CSV" não dá feedback (sem toast).
8. **`/parceiro` (visão geral)**: card "Promotores em destaque" tem "Ver todos" ok, mas os itens da lista não são clicáveis.

## Plano de execução (MVP, cirúrgico)

### 1. Ponte entre os dois portais
- Em `AppShell`, adicionar no header (ao lado do toggle de tema) um botão discreto **"Portal da operadora"** que leva a `/parceiro`. Só um link — sem lógica de permissão neste MVP.
- Em `PartnerShell`, adicionar no header um botão espelhado **"Ver como promotor"** que leva a `/`. Reforça a ideia de "mesma conta, dois lados".
- Renomear labels do bottom-nav mobile para caberem: "Visão", "Promotores", "Depósitos", "Pagar".

### 2. Detalhe do promotor (nova rota)
- Criar `src/routes/parceiro.promotores.$id.tsx` com:
  - Header com nome, @handle, nível, status, botão **Voltar**.
  - 3 KPIs: indicações, depósitos MTD, comissão devida (com `CountUp`).
  - Sparkline simples (SVG puro, sem lib nova) dos últimos 6 meses — dado mock derivado.
  - Bloco de ações: **Pausar promotor**, **Copiar link do promotor**, **Enviar mensagem** (abre `mailto:`). Todas com toast de confirmação.
  - Lista dos últimos 5 depósitos atribuídos (mock em `partnerData`).
- Na tabela de Promotores e no card "Promotores em destaque" da visão geral, envolver as linhas em `<Link>` para a nova rota.

### 3. Toolbar e estados vazios
- Em `/parceiro/promotores`, adicionar botão **"Limpar filtros"** que aparece quando há filtro/busca ativos, e no estado vazio um CTA que limpa tudo.
- Adicionar um toast global (usar `sonner`, já existente no template shadcn) para feedback de:
  - "CSV exportado" em `/parceiro/depositos`
  - "Promotor pausado", "Link copiado", "Mensagem aberta" no detalhe do promotor.

### 4. Contestação de valor (mini-fluxo)
- Em `/parceiro/pagamentos`, transformar o card "Precisa contestar um valor?" num pequeno formulário inline: `select` do promotor + `textarea` da nota + botão **Enviar contestação**. Ao enviar, mostra toast "Contestação registrada — respondemos em 48h" e desmarca o promotor automaticamente. Estado local apenas.

### 5. Ajustes finos
- `PartnerShell`: no mobile, sticky bottom-nav com `padding-bottom` seguro (safe-area).
- Consertar hover falso: remover `cursor-pointer` de linhas que não navegam; nas que navegam agora, manter.
- Adicionar `<Toaster />` do sonner em `__root.tsx` se ainda não estiver montado.

## O que não vou mexer
- Paleta, tipografia, hero cards, `CountUp`, layout geral.
- Painel do promotor (`/`, `/link`, `/extrato`, `/receber`, `/onboarding`).
- Lógica de dados reais / backend — segue tudo mock em `src/lib/partnerData.ts`.
- Nenhuma dependência nova (sonner já vem do template shadcn).

## Detalhes técnicos
- Nova rota segue naming plano do TanStack: `parceiro.promotores.$id.tsx` → `/parceiro/promotores/$id`. `createFileRoute("/parceiro/promotores/$id")`, `Route.useParams()`, `notFoundComponent` para id inválido.
- Sparkline: função pura que gera `<path d="M..."/>` a partir de array de 6 números — zero libs.
- Toast: `import { toast } from "sonner"` + `<Toaster richColors position="top-center" />` no root (verificar se já existe antes de duplicar).
- `partnerData.ts` ganha `depositsHistory: number[]` (6 pontos) e `recentDeposits: {date, player, amount}[]` por promotor, tudo mock determinístico.