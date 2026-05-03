# Elyon Hub — Roadmap de Tarefas MVP v1.0

> Etapa 3 de 4 · Tarefas detalhadas por fase  
> Cada tarefa contém: objetivo, entrada e saída esperada

---

## FASE 1 — BASE

### T1.1 — Setup do Monorepo

**Objetivo:** Criar a estrutura do monorepo com Turborepo e pnpm, configurando todos os pacotes e workspaces.

**Entrada:**
- Repositório Git vazio
- Decisões de stack (Turborepo + pnpm)

**Saída esperada:**
```
elyonhub/
├── apps/web/          # Next.js (scaffolded)
├── apps/api/          # NestJS (scaffolded)
├── packages/ui/       # vazio com package.json
├── packages/utils/    # vazio com package.json
├── packages/types/    # vazio com package.json
├── turbo.json         # pipelines: build, dev, lint
├── package.json       # root com workspaces
└── pnpm-workspace.yaml
```
Comando `pnpm dev` sobe todos os apps simultaneamente.

---

### T1.2 — Configuração do Next.js

**Objetivo:** Configurar o app `web` com Next.js 14 (App Router), Tailwind CSS, shadcn/ui e estrutura de pastas definitiva.

**Entrada:**
- `apps/web` criado pelo T1.1
- Design tokens da paleta (#553159, #7D6AA6, #BDB0D9, #A68881, #0D0D0D)

**Saída esperada:**
- `tailwind.config.ts` com cores customizadas e fonte Inter
- shadcn/ui inicializado com tema customizado
- Estrutura de pastas `app/(public)`, `app/(auth)`, `app/(app)`
- Alias `@/` configurado no tsconfig
- `middleware.ts` com stub de proteção de rotas
- Página `app/page.tsx` com "Hello Elyon Hub" funcionando em `localhost:3000`

---

### T1.3 — Configuração do NestJS

**Objetivo:** Configurar o app `api` com NestJS, Prisma, validação global e estrutura de módulos.

**Entrada:**
- `apps/api` criado pelo T1.1
- Decisão de usar Prisma ORM

**Saída esperada:**
- NestJS com `@nestjs/config` carregando `.env`
- Prisma instalado, `schema.prisma` com datasource PostgreSQL
- `ValidationPipe` global com class-validator
- `helmet` e `@nestjs/throttler` configurados
- CORS configurado para `CORS_ORIGINS` do env
- Pasta `src/modules/` criada
- Health check `GET /health` retornando `{ status: "ok" }`
- API rodando em `localhost:3001`

---

### T1.4 — Configuração do PostgreSQL e Prisma

**Objetivo:** Criar e aplicar o schema completo do banco de dados com todas as tabelas do MVP.

**Entrada:**
- Schema Prisma da especificação (T1.3 configurado)
- PostgreSQL disponível (local via Docker ou Railway)

**Saída esperada:**
- `docker-compose.yml` com PostgreSQL 16 para desenvolvimento local
- `schema.prisma` com todos os models: `Plan`, `Company`, `User`, `Lead`, `PipelineEvent`, `Conversation`, `Message`, `RefreshToken`
- Enums: `Role`, `LeadStatus`, `PipelineStage`, `LeadSource`, `ConversationStatus`, `MessageDirection`
- Migration `0001_initial` aplicada com sucesso
- Seed com 1 plano `starter` e 1 empresa de teste + 1 admin

---

### T1.5 — Configuração do packages/utils

**Objetivo:** Implementar todas as funções utilitárias compartilhadas entre web e api.

**Entrada:**
- `packages/utils` criado (T1.1)
- Assinaturas de funções definidas na especificação

**Saída esperada:**

```typescript
// date.ts — testado
formatDate('2024-01-15') === '15/01/2024'
fromNow(subDays(new Date(), 3)) === 'há 3 dias'
isOverdue(subDays(new Date(), 5), 3) === true

// currency.ts — testado
formatBRL(1234.56) === 'R$ 1.234,56'
parseBRL('R$ 1.234,56') === 1234.56

// document.ts — testado
formatCPF('12345678900') === '123.456.789-00'
formatCNPJ('12345678000190') === '12.345.678/0001-90'
validateCPF('529.982.247-25') === true

// phone.ts — testado
formatPhone('11999999999') === '(11) 99999-9999'
toE164('(11) 99999-9999') === '+5511999999999'
```

---

## FASE 2 — AUTENTICAÇÃO

### T2.1 — Backend: AuthModule

**Objetivo:** Implementar autenticação completa com identificação automática de empresa por domínio de email.

**Entrada:**
- Banco com tabelas `users`, `companies`, `refresh_tokens` (T1.4)
- Variáveis: `JWT_SECRET`, `JWT_REFRESH_SECRET`

**Saída esperada:**

Endpoints funcionais:
```
POST /auth/login
  body: { email, password }
  → 200: { accessToken, refreshToken, user: { id, name, role, companyId } }
  → 401: Credenciais inválidas
  → 401: Empresa inativa ou não encontrada

POST /auth/refresh
  body: { refreshToken }
  → 200: { accessToken, refreshToken }
  → 401: Token inválido ou expirado

POST /auth/logout
  headers: Authorization Bearer
  → 200: { message: "Logout realizado" }
  → Revoga refresh token no banco
```

Regras:
- Senha hasheada com bcrypt (rounds 12)
- Access token expira em 15min
- Refresh token expira em 7 dias
- Refresh token salvo como hash no banco
- Domínio extraído do email para identificar empresa

---

### T2.2 — Backend: TenantGuard e Decorators

**Objetivo:** Criar mecanismo que injeta e valida o `companyId` em toda request autenticada.

**Entrada:**
- AuthModule funcionando (T2.1)
- JWT payload com `companyId`

**Saída esperada:**
```typescript
// Decorators funcionais:
@CurrentUser()   → retorna { id, name, role, companyId }
@CompanyId()     → retorna string (companyId do token)
@Roles(Role.ADMIN) → lança 403 se papel insuficiente

// TenantGuard:
// - Verifica se company existe e está ativa
// - Lança 401 se company inativa
// - Todas as rotas privadas protegidas automaticamente
```

---

### T2.3 — Backend: UsersModule

**Objetivo:** CRUD de usuários com restrição por empresa e papel.

**Entrada:**
- TenantGuard (T2.2)
- Tabela `users`

**Saída esperada:**
```
GET    /users              → lista usuários da empresa (admin only)
POST   /users              → cria usuário na empresa (admin only)
PATCH  /users/:id          → atualiza nome/papel (admin only)
DELETE /users/:id          → desativa usuário (admin only, não pode desativar a si mesmo)
```

Regras:
- Email único global (validado antes de salvar)
- Criação já com senha temporária enviada por email (stub no MVP — apenas loga)
- Usuário não pode alterar próprio papel
- Seller não acessa o módulo

---

### T2.4 — Frontend: Tela de Login

**Objetivo:** Criar página de login com formulário e integração com AuthModule.

**Entrada:**
- `app/(auth)/login/page.tsx`
- AuthService backend funcionando (T2.1)
- Design system configurado (T1.2)

**Saída esperada:**
- Tela centralizada com logo Elyon Hub
- Campos: Email, Senha (com toggle de visibilidade)
- Botão "Entrar" com estado de loading
- Mensagem de erro inline (credenciais inválidas, empresa não encontrada)
- Ao logar: salva token no cookie httpOnly via route handler e redireciona para `/dashboard`
- Responsivo mobile-first (375px)
- Sem link de "criar conta" (acesso por convite no MVP)

---

### T2.5 — Frontend: Middleware de Proteção de Rotas

**Objetivo:** Garantir que rotas `/app/*` só sejam acessíveis com token válido.

**Entrada:**
- Cookie com accessToken (T2.4)
- `middleware.ts` stub (T1.2)

**Saída esperada:**
- Acesso a `/dashboard` sem token → redireciona para `/login`
- Acesso a `/login` com token → redireciona para `/dashboard`
- Token expirado → tenta refresh automático → se falhar, redireciona para `/login`
- `useAuth` hook disponível com `{ user, companyId, role, logout }`

---

## FASE 3 — CORE CRM

### T3.1 — Backend: LeadsModule

**Objetivo:** CRUD completo de leads com filtros, paginação e busca.

**Entrada:**
- TenantGuard (T2.2)
- Tabela `leads`

**Saída esperada:**
```
GET    /leads              → lista com filtros: stage, status, assignedTo, search, page, limit
POST   /leads              → cria lead manualmente
GET    /leads/:id          → detalhe com conversations e pipeline_events
PATCH  /leads/:id          → atualiza dados do lead
PATCH  /leads/:id/assign   → atribui a vendedor (admin only)
DELETE /leads/:id          → marca como perdido (soft delete)
```

Response de lista:
```json
{
  "data": [...],
  "meta": { "total": 120, "page": 1, "limit": 20 }
}
```

---

### T3.2 — Backend: PipelineModule

**Objetivo:** Gerenciar movimentação de leads entre etapas com histórico de eventos.

**Entrada:**
- LeadsModule (T3.1)
- Tabela `pipeline_events`

**Saída esperada:**
```
GET    /pipeline            → leads agrupados por stage (board view)
PATCH  /pipeline/:id/stage  → move lead para nova etapa
GET    /pipeline/:id/history → histórico de movimentações do lead
```

Regras:
- Toda movimentação gera um `PipelineEvent`
- Movimentação manual registra `triggeredBy` = userId
- Movimentação automática registra `reason = "auto_message"` e sem `triggeredBy`
- Não é possível mover lead `CLOSED` ou `LOST` sem ser admin

---

### T3.3 — Frontend: Página de Leads (Lista)

**Objetivo:** Tela de listagem de leads com busca, filtros e ações rápidas.

**Entrada:**
- LeadsModule backend (T3.1)
- Componentes Table, Badge, Dialog (packages/ui)

**Saída esperada:**
- Tabela responsiva com colunas: Nome, Telefone, Etapa, Vendedor, Último contato
- Busca por nome ou telefone (debounce 300ms)
- Filtro por etapa do pipeline (tabs ou select)
- Filtro por vendedor (admin vê todos, seller vê apenas os seus)
- Paginação (20 por página)
- Badge colorido por etapa do pipeline
- Indicador de follow-up (ícone de alerta se `isOverdue`)
- Ação rápida: ver detalhe, mover etapa, atribuir
- Botão "Novo Lead" abre Dialog com formulário
- Empty state com ilustração quando não há leads

---

### T3.4 — Frontend: Página do Pipeline (Kanban)

**Objetivo:** Visualização Kanban com drag & drop para movimentação de leads entre etapas.

**Entrada:**
- PipelineModule backend (T3.2)
- Biblioteca: `@dnd-kit/core` (acessível, sem jQuery)

**Saída esperada:**
- 6 colunas: Novo Lead, Contato, Negociação, Proposta, Fechado, Perdido
- Cards com: nome do lead, telefone, vendedor, tempo na etapa
- Drag & drop funcional → chama `PATCH /pipeline/:id/stage`
- Loading skeleton durante carregamento
- Badge de contagem no header de cada coluna
- Mobile: scroll horizontal entre colunas (swipeable)
- Clique no card abre drawer lateral com detalhe do lead

---

### T3.5 — Frontend: Detalhe do Lead

**Objetivo:** Tela completa de informações e histórico do lead.

**Entrada:**
- LeadsModule backend (T3.1)
- PipelineModule (histórico) (T3.2)

**Saída esperada:**
- Header: nome, telefone, status, etapa atual
- Seções com tabs: Informações | Histórico | Conversas
- Tab Informações: dados completos + formulário de edição inline
- Tab Histórico: timeline de eventos do pipeline com data e autor
- Tab Conversas: lista de conversas com link para inbox
- Botão "Mover Etapa" com select de destino
- Botão "Atribuir Vendedor" (admin only)
- Responsivo: layout em coluna única no mobile

---

## FASE 4 — ATENDIMENTO

### T4.1 — Backend: ConversationsModule e MessagesModule

**Objetivo:** Gerenciar conversas e histórico de mensagens por lead/empresa.

**Entrada:**
- LeadsModule (T3.1)
- Tabelas `conversations`, `messages`

**Saída esperada:**
```
GET    /conversations           → lista conversas ativas da empresa (com último msg)
GET    /conversations/:id       → detalhe com mensagens paginadas
POST   /messages/send           → envia mensagem via WhatsApp
  body: { conversationId, body }
```

Regras:
- Lista ordenada por última mensagem (mais recente primeiro)
- Mensagens paginadas (50 por request, scroll infinito)
- Envio atualiza `lastContact` do lead

---

### T4.2 — Backend: WebhooksModule (WhatsApp)

**Objetivo:** Receber mensagens do WhatsApp via webhook, criar leads automaticamente e processar pipeline.

**Entrada:**
- ConversationsModule (T4.1)
- PipelineModule (T3.2)
- Evolution API configurada

**Saída esperada:**
```
POST /webhooks/whatsapp
  → Identifica empresa pelo instanceName
  → Busca lead pelo phone + companyId
  → Se não existe: cria lead com source=WHATSAPP, stage=NEW
  → Cria/busca conversation
  → Salva message com direction=INBOUND
  → Atualiza lastContact
  → Se stage=NEW: auto-avança para CONTACT
  → Retorna 200 sempre (idempotente)
```

Segurança:
- Valida token secreto no header do webhook
- Trata duplicatas via `externalId` da mensagem

---

### T4.3 — Backend: WhatsApp Provider (Evolution API)

**Objetivo:** Implementar abstração de envio de mensagens via Evolution API.

**Entrada:**
- `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` no env
- Interface `WhatsAppProvider`

**Saída esperada:**
```typescript
class EvolutionProvider implements WhatsAppProvider {
  sendText(instanceName, to, body): Promise<void>
  sendMedia(instanceName, to, url, caption): Promise<void>
}
```
- Injeção por DI no NestJS
- Logs de erro sem expor credenciais
- Timeout de 10s nas chamadas HTTP

---

### T4.4 — Frontend: Inbox (Lista de Conversas)

**Objetivo:** Tela de inbox estilo WhatsApp Web com lista de conversas e área de chat.

**Entrada:**
- ConversationsModule backend (T4.1)
- Componente ChatBubble (packages/ui)

**Saída esperada:**
- Layout dividido: sidebar (conversas) + área principal (chat)
- Sidebar: avatar do lead, nome, prévia da última mensagem, horário
- Busca por nome ou telefone na sidebar
- Conversa ativa destacada com cor primária
- Área de chat: histórico de mensagens com scroll até o fim
- Bolhas: `OUTBOUND` alinhada à direita, `INBOUND` à esquerda
- Input de envio fixo no rodapé com botão de enviar
- Loader enquanto carrega mensagens
- Mobile: sidebar ocupa tela inteira → tap abre chat (back button para voltar)

---

## FASE 5 — DASHBOARD

### T5.1 — Backend: DashboardModule

**Objetivo:** Agregar métricas de negócio por empresa e período.

**Entrada:**
- Tabelas de leads, mensagens, pipeline_events
- Parâmetros de filtro: `from`, `to` (padrão: últimos 30 dias)

**Saída esperada:**
```
GET /dashboard?from=2024-01-01&to=2024-01-31
→ {
    totalLeads: 120,
    activeLeads: 87,
    closedLeads: 22,
    lostLeads: 11,
    conversionRate: 66.7,          // closed / (closed + lost)
    leadsByStage: {
      NEW: 15, CONTACT: 30,
      NEGOTIATION: 20, PROPOSAL: 22,
      CLOSED: 22, LOST: 11
    },
    overdueLeads: 8,               // sem follow-up
    avgTimeToClose: 12.5           // dias médios até fechamento
  }
```

---

### T5.2 — Frontend: Página de Dashboard

**Objetivo:** Tela de métricas com cards de KPIs e visualização de funil.

**Entrada:**
- DashboardModule backend (T5.1)
- Componentes StatCard, Badge (packages/ui)
- Biblioteca: `recharts` para gráfico de funil

**Saída esperada:**
- Filtro de período: Últimos 7 dias | 30 dias | 90 dias | Personalizado
- Grid de cards: Total de Leads, Leads Ativos, Taxa de Conversão, Leads em Atraso, Tempo Médio de Fechamento
- Gráfico de barras: leads por etapa do pipeline
- Card de alerta se `overdueLeads > 0` com link para `/follow-up`
- Skeleton loading durante fetch
- Mobile: cards empilhados em coluna única

---

## FASE 6 — CONFIGURAÇÕES

### T6.1 — Backend: CompaniesModule (settings)

**Objetivo:** Endpoints para admin gerenciar dados e configurações da empresa.

**Entrada:**
- Tabela `companies`
- CompanyId do JWT

**Saída esperada:**
```
GET   /companies/me         → dados da empresa logada
PATCH /companies/me         → atualiza nome, logo, followUpDays
PATCH /companies/me/whatsapp → salva instanceId, apiKey, numbers
```

Regras:
- Apenas `ADMIN` acessa
- Upload de logo: recebe URL pública (armazenamento externo no MVP)
- `emailDomain` não é editável após criação

---

### T6.2 — Frontend: Página de Configurações

**Objetivo:** Interface para admin configurar empresa, usuários e integração WhatsApp.

**Entrada:**
- CompaniesModule (T6.1)
- UsersModule (T2.3)

**Saída esperada:**
- Tabs: Empresa | Usuários | Integração WhatsApp
- **Tab Empresa:** formulário com nome, logo (upload por URL), dias de follow-up
- **Tab Usuários:** tabela com nome, email, papel, status + botões editar/desativar + Dialog "Novo Usuário"
- **Tab WhatsApp:** campos instanceId, apiKey, número(s) conectado(s)
- Toast de sucesso/erro ao salvar
- Proteção: redireciona seller para `/dashboard`

---

## FASE 7 — PÁGINA PÚBLICA

### T7.1 — Frontend: Landing Page

**Objetivo:** Criar a página pública de apresentação do Elyon Hub com foco em conversão.

**Entrada:**
- Paleta de cores e design system (T1.2)
- Conteúdo: features, planos, branding Natan Sousa Tech

**Saída esperada:**

Seções na ordem:
1. **Navbar** — logo + botão "Entrar" (link para /login)
2. **Hero** — headline impactante + subtítulo + CTA "Quero começar" + imagem do produto
3. **Como funciona** — 3 cards: "1. Conecte o WhatsApp", "2. Leads chegam sozinhos", "3. Feche mais negócios"
4. **Features** — grid 2x3: Inbox, Pipeline Kanban, Follow-up automático, Dashboard, Multi-usuário, Relatórios
5. **Planos** — tabela comparativa (seção T7.2)
6. **CTA Final** — "Comece hoje com o plano Starter"
7. **Footer** — Natan Sousa Tech · Todos os direitos reservados · 2024

Responsivo, animações suaves com Tailwind (sem biblioteca extra).

---

### T7.2 — Frontend: Seção de Planos SaaS

**Objetivo:** Exibir tabela comparativa dos planos com CTA para contato/contratação.

**Entrada:**
- Definição de planos (Starter R$97, Pro R$297, Scale R$697)

**Saída esperada:**
- Cards dos 3 planos (Starter, Pro, Scale)
- Plano Pro destacado com badge "Mais popular"
- Lista de features por plano com checkmarks
- Preço em destaque com período "/mês"
- Botão "Começar" que abre WhatsApp do suporte (stub com link wa.me)
- Mobile: cards em coluna única com scroll

---

## FASE 8 — SAAS E FINALIZAÇÃO

### T8.1 — Backend: PlansModule

**Objetivo:** Gerenciar planos e vincular empresas, com enforcement de limites.

**Entrada:**
- Tabelas `plans`, `companies`
- Seed com 3 planos (T1.4)

**Saída esperada:**
```
GET /plans              → lista planos públicos (sem auth)
GET /companies/me/plan  → plano atual da empresa logada
```

Enforcement por plano:
- Middleware verifica limite de usuários ao criar novo usuário
- Verificação de limite de leads ao criar lead via webhook
- Retorna `402 Payment Required` quando limite atingido

---

### T8.2 — Frontend: Follow-up

**Objetivo:** Tela de leads em atraso com acesso rápido para retomar contato.

**Entrada:**
- `GET /leads?overdue=true`
- `isOverdue` util (packages/utils)

**Saída esperada:**
- Lista de leads sem contato há mais de N dias (configurado na empresa)
- Cards com: nome, telefone, dias sem contato, vendedor responsável
- Botão "Abrir conversa" que vai para o inbox do lead
- Filtro por vendedor (admin vê todos)
- Badge com quantidade no menu lateral
- Empty state: "Nenhum lead em atraso. Continue assim!"

---

### T8.3 — Backend: ReportsModule (PDF)

**Objetivo:** Gerar relatórios em PDF via pdfmake com dados reais da empresa.

**Entrada:**
- Queries de leads, pipeline_events
- Filtro: `from`, `to`
- Biblioteca pdfmake

**Saída esperada:**
```
GET /reports/leads?from=...&to=...      → PDF download
GET /reports/conversion?from=...&to=... → PDF download
GET /reports/sales?from=...&to=...      → PDF download
```

Conteúdo dos PDFs:
- **Leads:** tabela com nome, telefone, etapa, vendedor, data criação
- **Conversão:** funil com totais e percentuais por etapa
- **Vendas:** leads fechados com data e valor (quando houver)

Header de cada PDF: logo + nome da empresa + período + data de geração  
Footer: "Gerado por Elyon Hub · Natan Sousa Tech"

---

### T8.4 — Frontend: Página de Relatórios

**Objetivo:** Interface para selecionar e baixar relatórios em PDF.

**Entrada:**
- ReportsModule backend (T8.3)

**Saída esperada:**
- 3 cards de relatório: Leads, Conversão, Vendas
- Cada card: descrição + seletor de período + botão "Baixar PDF"
- Estado de loading no botão durante geração
- Toast de erro se falhar
- Restrito a `ADMIN`

---

### T8.5 — Layout Principal e Componentes Globais

**Objetivo:** Finalizar layout autenticado com sidebar, navegação e botão de logout flutuante.

**Entrada:**
- Todas as páginas implementadas
- Design system (T1.2)

**Saída esperada:**
- Sidebar com ícones e labels: Dashboard, Pipeline, Inbox, Leads, Follow-up, Relatórios, Configurações
- Badge de contagem em "Inbox" (conversas abertas) e "Follow-up" (leads em atraso)
- Sidebar colapsável no desktop (ícones apenas)
- Mobile: bottom navigation com 5 itens principais
- **Botão de logout flutuante:** canto inferior direito, ícone de sair, tooltip "Sair", cor vermelha ao hover
- Loading state global (barra de progresso no topo)

---

## Sumário das Tarefas

| #    | Tarefa                          | Fase | Dep.           | Prioridade |
|------|---------------------------------|------|----------------|------------|
| T1.1 | Setup Monorepo                  | 1    | —              | P0         |
| T1.2 | Config Next.js                  | 1    | T1.1           | P0         |
| T1.3 | Config NestJS                   | 1    | T1.1           | P0         |
| T1.4 | PostgreSQL + Prisma + Seed      | 1    | T1.3           | P0         |
| T1.5 | packages/utils                  | 1    | T1.1           | P0         |
| T2.1 | AuthModule (backend)            | 2    | T1.4           | P0         |
| T2.2 | TenantGuard + Decorators        | 2    | T2.1           | P0         |
| T2.3 | UsersModule (backend)           | 2    | T2.2           | P1         |
| T2.4 | Login (frontend)                | 2    | T2.1           | P0         |
| T2.5 | Middleware de Rotas             | 2    | T2.4           | P0         |
| T3.1 | LeadsModule (backend)           | 3    | T2.2           | P0         |
| T3.2 | PipelineModule (backend)        | 3    | T3.1           | P0         |
| T3.3 | Leads — Lista (frontend)        | 3    | T3.1           | P1         |
| T3.4 | Pipeline — Kanban (frontend)    | 3    | T3.2, T3.3     | P1         |
| T3.5 | Lead — Detalhe (frontend)       | 3    | T3.1, T3.2     | P1         |
| T4.1 | Conversations + Messages        | 4    | T3.1           | P1         |
| T4.2 | WebhooksModule                  | 4    | T4.1, T3.2     | P1         |
| T4.3 | WhatsApp Provider               | 4    | T4.1           | P1         |
| T4.4 | Inbox (frontend)                | 4    | T4.1           | P1         |
| T5.1 | DashboardModule (backend)       | 5    | T3.1, T3.2     | P2         |
| T5.2 | Dashboard (frontend)            | 5    | T5.1           | P2         |
| T6.1 | CompaniesModule settings        | 6    | T2.2           | P2         |
| T6.2 | Configurações (frontend)        | 6    | T6.1, T2.3     | P2         |
| T7.1 | Landing Page                    | 7    | T1.2           | P2         |
| T7.2 | Seção de Planos                 | 7    | T7.1           | P2         |
| T8.1 | PlansModule                     | 8    | T1.4           | P3         |
| T8.2 | Follow-up (frontend)            | 8    | T3.1           | P2         |
| T8.3 | ReportsModule PDF               | 8    | T3.1, T5.1     | P3         |
| T8.4 | Relatórios (frontend)           | 8    | T8.3           | P3         |
| T8.5 | Layout + Logout Flutuante       | 8    | T2.5           | P1         |

**Legenda de prioridade:**
- P0 — Bloqueante, deve ser feito primeiro
- P1 — Core do produto, semana 1-2
- P2 — Complementar, semana 3-4
- P3 — Nice-to-have MVP, semana 4+

---

*Roadmap gerado em 2026-05-03 · Elyon Hub v1.0 · Natan Sousa Tech*
