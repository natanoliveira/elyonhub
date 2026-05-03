# Elyon Hub — Planejamento Técnico v1.0

> Etapa 2 de 4 · Arquitetura detalhada para implementação  
> Base: Especificação v1.0

---

## 1. Estrutura do Monorepo

### Tooling

| Ferramenta   | Função                                         |
|--------------|------------------------------------------------|
| Turborepo    | Orquestração de builds e tasks                 |
| pnpm         | Gerenciador de pacotes (workspaces)            |
| TypeScript   | Base para todos os pacotes                     |
| ESLint       | Lint compartilhado                             |
| Prettier     | Formatação compartilhada                       |

### Árvore Completa

```
elyonhub/
├── apps/
│   ├── web/                          # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (public)/             # landing, planos
│   │   │   ├── (auth)/               # login
│   │   │   └── (app)/                # área autenticada
│   │   │       ├── dashboard/
│   │   │       ├── leads/
│   │   │       ├── pipeline/
│   │   │       ├── inbox/
│   │   │       ├── follow-up/
│   │   │       ├── reports/
│   │   │       └── settings/
│   │   ├── components/               # componentes locais do web
│   │   ├── hooks/                    # hooks React locais
│   │   ├── services/                 # chamadas à API (axios)
│   │   ├── stores/                   # estado global (zustand)
│   │   ├── middleware.ts             # proteção de rotas Next.js
│   │   └── tailwind.config.ts
│   │
│   └── api/                          # NestJS
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── companies/
│           │   ├── users/
│           │   ├── leads/
│           │   ├── pipeline/
│           │   ├── conversations/
│           │   ├── messages/
│           │   ├── follow-up/
│           │   ├── dashboard/
│           │   ├── reports/
│           │   └── webhooks/
│           ├── common/
│           │   ├── guards/           # AuthGuard, TenantGuard
│           │   ├── decorators/       # @CurrentUser, @CompanyId
│           │   ├── filters/          # exceção global
│           │   ├── interceptors/     # logging, transform
│           │   └── pipes/            # validação global
│           ├── database/
│           │   └── prisma/
│           │       ├── schema.prisma
│           │       └── migrations/
│           └── main.ts
│
├── packages/
│   ├── ui/                           # componentes compartilhados
│   │   └── src/
│   │       ├── button/
│   │       ├── dialog/
│   │       ├── modal/
│   │       ├── table/
│   │       ├── card/
│   │       ├── toast/
│   │       ├── badge/
│   │       ├── avatar/
│   │       ├── kanban/
│   │       └── chat-bubble/
│   │
│   ├── utils/                        # funções utilitárias
│   │   └── src/
│   │       ├── date.ts
│   │       ├── currency.ts
│   │       ├── document.ts
│   │       └── phone.ts
│   │
│   └── types/                        # tipos TypeScript compartilhados
│       └── src/
│           ├── auth.types.ts
│           ├── lead.types.ts
│           ├── company.types.ts
│           └── enums.ts
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## 2. Banco de Dados

### 2.1 Schema Prisma Completo

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── PLANOS ──────────────────────────────────────────
model Plan {
  id          String   @id @default(uuid())
  name        String   // starter | pro | scale
  price       Decimal  @db.Decimal(10,2)
  maxUsers    Int
  maxLeads    Int
  maxNumbers  Int
  features    Json     // array de strings
  active      Boolean  @default(true)
  companies   Company[]
  createdAt   DateTime @default(now())

  @@map("plans")
}

// ─── EMPRESAS ────────────────────────────────────────
model Company {
  id           String   @id @default(uuid())
  name         String
  emailDomain  String   @unique
  logoUrl      String?
  planId       String
  plan         Plan     @relation(fields: [planId], references: [id])
  active       Boolean  @default(true)
  whatsappConfig Json?  // { instanceId, apiKey, numbers: [] }
  followUpDays Int      @default(3)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  users         User[]
  leads         Lead[]
  conversations Conversation[]

  @@map("companies")
}

// ─── USUÁRIOS ────────────────────────────────────────
model User {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  email       String   @unique
  password    String   // bcrypt
  role        Role     @default(SELLER)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  assignedLeads   Lead[]           @relation("AssignedLeads")
  pipelineEvents  PipelineEvent[]
  refreshTokens   RefreshToken[]

  @@map("users")
}

enum Role {
  ADMIN
  SELLER
}

// ─── LEADS ───────────────────────────────────────────
model Lead {
  id            String        @id @default(uuid())
  companyId     String
  company       Company       @relation(fields: [companyId], references: [id])
  name          String
  phone         String        // E.164
  email         String?
  status        LeadStatus    @default(ACTIVE)
  pipelineStage PipelineStage @default(NEW)
  assignedTo    String?
  assignedUser  User?         @relation("AssignedLeads", fields: [assignedTo], references: [id])
  source        LeadSource    @default(WHATSAPP)
  notes         String?
  lastContact   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  conversations  Conversation[]
  pipelineEvents PipelineEvent[]

  @@unique([companyId, phone])
  @@map("leads")
}

enum LeadStatus {
  ACTIVE
  CLOSED
  LOST
}

enum PipelineStage {
  NEW
  CONTACT
  NEGOTIATION
  PROPOSAL
  CLOSED
  LOST
}

enum LeadSource {
  WHATSAPP
  MANUAL
  IMPORT
}

// ─── EVENTOS DO PIPELINE ─────────────────────────────
model PipelineEvent {
  id          String        @id @default(uuid())
  leadId      String
  lead        Lead          @relation(fields: [leadId], references: [id])
  fromStage   PipelineStage
  toStage     PipelineStage
  triggeredBy String?
  user        User?         @relation(fields: [triggeredBy], references: [id])
  reason      String?       // "auto_message" | "manual" | "webhook"
  createdAt   DateTime      @default(now())

  @@map("pipeline_events")
}

// ─── CONVERSAS ───────────────────────────────────────
model Conversation {
  id              String             @id @default(uuid())
  companyId       String
  company         Company            @relation(fields: [companyId], references: [id])
  leadId          String
  lead            Lead               @relation(fields: [leadId], references: [id])
  whatsappNumber  String
  status          ConversationStatus @default(OPEN)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  messages Message[]

  @@map("conversations")
}

enum ConversationStatus {
  OPEN
  CLOSED
  WAITING
}

// ─── MENSAGENS ───────────────────────────────────────
model Message {
  id             String          @id @default(uuid())
  conversationId String
  conversation   Conversation    @relation(fields: [conversationId], references: [id])
  direction      MessageDirection
  body           String?
  mediaUrl       String?
  mediaType      String?
  externalId     String?         // ID da mensagem no WhatsApp
  sentAt         DateTime        @default(now())

  @@map("messages")
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

// ─── REFRESH TOKENS ──────────────────────────────────
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  tokenHash String   @unique
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("refresh_tokens")
}
```

### 2.2 Índices Críticos

```sql
-- Queries mais frequentes
CREATE INDEX idx_leads_company_stage     ON leads(company_id, pipeline_stage);
CREATE INDEX idx_leads_company_phone     ON leads(company_id, phone);
CREATE INDEX idx_leads_last_contact      ON leads(company_id, last_contact);
CREATE INDEX idx_messages_conversation   ON messages(conversation_id, sent_at);
CREATE INDEX idx_conversations_lead      ON conversations(lead_id);
CREATE INDEX idx_pipeline_events_lead    ON pipeline_events(lead_id, created_at);
```

---

## 3. Backend — NestJS

### 3.1 Módulos e Responsabilidades

```
AuthModule
  ├── AuthController     POST /auth/login, /refresh, /logout
  ├── AuthService        login(), refresh(), logout()
  ├── JwtStrategy        valida access token
  ├── RefreshStrategy    valida refresh token
  └── AuthGuard          protege todas as rotas privadas

TenantModule
  ├── TenantMiddleware   injeta companyId no request via JWT
  └── TenantGuard        garante que company existe e está ativa

CompaniesModule
  ├── CompaniesController  GET/PATCH /companies/me
  └── CompaniesService     findByDomain(), update(), getConfig()

UsersModule
  ├── UsersController    CRUD /users (admin only)
  └── UsersService       create(), list(), update(), deactivate()

LeadsModule
  ├── LeadsController    CRUD /leads
  └── LeadsService       create(), list(), update(), assignTo()

PipelineModule
  ├── PipelineController  GET /pipeline, PATCH /pipeline/:id/stage
  └── PipelineService     getByStage(), moveStage(), autoAdvance()

ConversationsModule
  ├── ConversationsController  GET /conversations, GET /conversations/:id
  └── ConversationsService     listActive(), getHistory()

MessagesModule
  ├── MessagesController  POST /messages/send
  └── MessagesService     send(), saveInbound()

WebhooksModule
  ├── WebhooksController  POST /webhooks/whatsapp
  └── WebhooksService     handleInbound() → cria lead + mensagem + avança pipeline

FollowUpModule
  ├── FollowUpController  GET /follow-up
  └── FollowUpService     getStale() — leads com last_contact atrasado

DashboardModule
  ├── DashboardController  GET /dashboard
  └── DashboardService     getMetrics() — queries agregadas

ReportsModule
  ├── ReportsController   GET /reports/leads, /reports/conversion, /reports/sales
  └── ReportsService      generatePDF() com pdfmake
```

### 3.2 Guards e Decorators

```typescript
// common/guards/auth.guard.ts
// Valida JWT, injeta req.user

// common/guards/tenant.guard.ts
// Verifica company ativa, injeta req.companyId

// common/decorators/current-user.decorator.ts
@CurrentUser() → extrai user do request

// common/decorators/company-id.decorator.ts
@CompanyId() → extrai companyId do JWT

// common/decorators/roles.decorator.ts
@Roles(Role.ADMIN) → restringe por papel
```

### 3.3 Fluxo de Request Privado

```
Request → AuthGuard (valida JWT)
        → TenantMiddleware (injeta companyId)
        → RolesGuard (verifica papel se necessário)
        → Controller → Service (sempre filtra por companyId)
        → Response
```

### 3.4 Interceptor de Transformação

```typescript
// Todas as responses seguem o padrão:
{
  data: T,
  meta?: { total, page, limit },
  message?: string
}
```

---

## 4. Frontend — Next.js

### 4.1 App Router — Grupos de Rotas

```
app/
├── (public)/
│   └── page.tsx              # landing page
│
├── (auth)/
│   └── login/
│       └── page.tsx          # tela de login
│
└── (app)/                    # requer autenticação
    ├── layout.tsx            # sidebar + logout flutuante
    ├── dashboard/
    │   └── page.tsx
    ├── leads/
    │   ├── page.tsx          # lista de leads
    │   └── [id]/
    │       └── page.tsx      # detalhe do lead
    ├── pipeline/
    │   └── page.tsx          # kanban
    ├── inbox/
    │   ├── page.tsx          # lista de conversas
    │   └── [id]/
    │       └── page.tsx      # chat
    ├── follow-up/
    │   └── page.tsx
    ├── reports/
    │   └── page.tsx
    └── settings/
        ├── page.tsx          # dados da empresa
        └── users/
            └── page.tsx      # gestão de usuários
```

### 4.2 Middleware de Proteção

```typescript
// middleware.ts
// Redireciona /app/* para /login se não tiver cookie de token
// Redireciona / para /dashboard se autenticado
```

### 4.3 Services (camada de API)

```typescript
// services/auth.service.ts
login(email, password) → { accessToken, refreshToken, user }
logout()
refreshToken()

// services/leads.service.ts
list(filters) → Lead[]
create(dto) → Lead
update(id, dto) → Lead
moveStage(id, stage) → Lead

// services/pipeline.service.ts
getBoard() → Record<PipelineStage, Lead[]>

// services/conversations.service.ts
list() → Conversation[]
getMessages(id) → Message[]
sendMessage(id, body) → Message

// services/dashboard.service.ts
getMetrics(period) → DashboardMetrics

// services/reports.service.ts
downloadPDF(type, filters) → Blob
```

### 4.4 Hooks Reutilizáveis

```typescript
// hooks/useLeads.ts      → lista + mutações + filtros
// hooks/usePipeline.ts   → board + moveStage
// hooks/useInbox.ts      → conversas + mensagens em tempo real
// hooks/useAuth.ts       → user, logout, isAdmin
// hooks/useDashboard.ts  → métricas com react-query
// hooks/useToast.ts      → abstração sobre sonner
```

### 4.5 Estado Global (Zustand)

```typescript
// stores/auth.store.ts
{ user, companyId, accessToken, setAuth, clearAuth }

// stores/inbox.store.ts
{ activeConversation, setActiveConversation }
```

---

## 5. Multi-tenancy — Implementação Detalhada

### 5.1 Fluxo de Login com Identificação de Empresa

```typescript
// auth.service.ts
async login(email: string, password: string) {
  const domain = email.split('@')[1]          // "empresa.com.br"
  const company = await this.companiesService.findByDomain(domain)

  if (!company || !company.active) {
    throw new UnauthorizedException('Empresa não encontrada ou inativa')
  }

  const user = await this.usersService.findByEmail(email)
  await this.validatePassword(password, user.password)

  return this.issueTokens(user, company.id)
}
```

### 5.2 JWT Payload

```typescript
interface JwtPayload {
  sub: string       // userId
  companyId: string
  role: Role
  iat: number
  exp: number
}
```

### 5.3 Injeção de Tenant em Todas as Queries

```typescript
// Padrão obrigatório em todos os services:
async listLeads(companyId: string, filters: LeadFiltersDto) {
  return this.prisma.lead.findMany({
    where: {
      companyId,    // SEMPRE presente
      ...buildFilters(filters),
    },
  })
}
```

---

## 6. Integração WhatsApp

### 6.1 Abstração do Provider

```typescript
// modules/whatsapp/whatsapp.interface.ts
interface WhatsAppProvider {
  sendText(to: string, body: string): Promise<void>
  sendMedia(to: string, url: string, caption?: string): Promise<void>
}

// modules/whatsapp/evolution.provider.ts
// Implementação para Evolution API
class EvolutionProvider implements WhatsAppProvider { ... }
```

### 6.2 Webhook — Fluxo de Processamento

```typescript
// webhooks.service.ts
async handleInbound(payload: EvolutionWebhookDto) {
  const { from, body, instanceName } = payload

  // 1. Identificar empresa pelo número WhatsApp (instanceName)
  const company = await this.getCompanyByInstance(instanceName)

  // 2. Buscar ou criar lead
  let lead = await this.leadsService.findByPhone(company.id, from)
  if (!lead) {
    lead = await this.leadsService.create({
      companyId: company.id,
      phone: from,
      name: from,           // atualizado quando souber o nome
      source: LeadSource.WHATSAPP,
    })
  }

  // 3. Buscar ou criar conversation
  const conversation = await this.getOrCreateConversation(company.id, lead.id)

  // 4. Salvar mensagem
  await this.messagesService.save({
    conversationId: conversation.id,
    direction: MessageDirection.INBOUND,
    body,
  })

  // 5. Atualizar lastContact
  await this.leadsService.updateLastContact(lead.id)

  // 6. Auto-avançar pipeline
  await this.pipelineService.autoAdvance(lead)
}
```

### 6.3 Regras de Auto-avanço do Pipeline

```typescript
async autoAdvance(lead: Lead) {
  if (lead.pipelineStage === PipelineStage.NEW) {
    await this.moveStage(lead.id, PipelineStage.CONTACT, 'auto_message')
  }
  // Outras regras conforme necessidade do negócio
}
```

---

## 7. Componentização (packages/ui)

### 7.1 Contrato dos Componentes

```typescript
// Todos seguem o mesmo padrão de props:

// Button
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: ReactNode
  onClick?: () => void
}

// Table
interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  pagination?: PaginationProps
  onRowClick?: (row: T) => void
}

// Dialog
interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

// Toast (via sonner)
toast.success('Lead criado com sucesso')
toast.error('Erro ao salvar')
```

### 7.2 KanbanBoard

```typescript
interface KanbanBoardProps {
  columns: KanbanColumn[]
  onCardMove: (leadId: string, toStage: PipelineStage) => void
  loading?: boolean
}

interface KanbanColumn {
  id: PipelineStage
  label: string
  color: string
  cards: Lead[]
}
```

---

## 8. Utilitários (packages/utils)

```typescript
// date.ts
export const formatDate = (date: Date | string, fmt = 'dd/MM/yyyy'): string
export const fromNow = (date: Date | string): string    // "há 3 dias"
export const isOverdue = (date: Date | string, days: number): boolean

// currency.ts
export const formatBRL = (value: number): string        // "R$ 1.234,56"
export const parseBRL = (str: string): number

// document.ts
export const formatCPF = (value: string): string        // "123.456.789-00"
export const formatCNPJ = (value: string): string       // "12.345.678/0001-90"
export const validateCPF = (value: string): boolean
export const validateCNPJ = (value: string): boolean

// phone.ts
export const formatPhone = (value: string): string      // "(11) 99999-9999"
export const toE164 = (value: string, country = '55'): string
export const validatePhone = (value: string): boolean
```

---

## 9. Design System — Implementação

### 9.1 Configuração Tailwind

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary:     '#553159',
      'primary-alt': '#7D6AA6',
      muted:       '#BDB0D9',
      accent:      '#A68881',
      foreground:  '#0D0D0D',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
}
```

### 9.2 Layout Principal (área autenticada)

```
┌─────────────────────────────────────────────┐
│  SIDEBAR (64px collapsed / 240px expanded)  │
│  [Logo]                                     │
│  [Dashboard]                                │
│  [Pipeline]                                 │
│  [Inbox]                [CONTEÚDO PRINCIPAL]│
│  [Leads]                                    │
│  [Follow-up]                                │
│  [Relatórios]                               │
│  [Configurações]                            │
└──────────────────────────────────┬──────────┘
                                   │
                         [Botão logout flutuante]
                           canto inferior direito
```

### 9.3 Layout Mobile

```
┌────────────────┐
│  [Header] ≡    │  ← hamburger menu
│                │
│   Conteúdo     │
│                │
│ [●] Logout     │  ← FAB canto inferior direito
└────────────────┘
    [Bottom Nav]     ← tabs: Pipeline, Inbox, Leads, +
```

---

## 10. Deploy

### 10.1 Infraestrutura Recomendada

| Serviço           | Plataforma              | Motivo                              |
|-------------------|-------------------------|-------------------------------------|
| Frontend (web)    | Vercel                  | Edge, CI/CD automático, free tier   |
| Backend (api)     | Railway                 | Simples, escala bem, suporta NestJS |
| Banco (PostgreSQL)| Railway (managed)       | Mesma plataforma, backups automáticos|
| Evolution API     | VPS (DigitalOcean/Hetz) | Precisa de porta fixa para webhook  |
| Arquivos (logos)  | Cloudflare R2           | S3-compatible, barato               |

### 10.2 Variáveis de Ambiente

```bash
# apps/api/.env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
EVOLUTION_API_URL="https://..."
EVOLUTION_API_KEY="..."
CORS_ORIGINS="https://app.elyonhub.com.br"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="https://api.elyonhub.com.br"
```

### 10.3 Pipeline de CI/CD

```
Push para main
  ↓
GitHub Actions
  ├── lint + type-check
  ├── tests (quando houver)
  └── build (turbo build)
      ↓
  Vercel deploy (web) — automático
  Railway deploy (api) — automático via Dockerfile
```

---

## 11. Decisões de Arquitetura — Justificativas

| Decisão | Alternativa Considerada | Por quê esta |
|---------|------------------------|--------------|
| Prisma ORM | TypeORM | API mais simples, migrations mais seguras, melhor DX |
| pnpm workspaces | Nx | Mais leve, Turborepo já gerencia tasks |
| Zustand | Redux / Context API | Menos boilerplate, suficiente para o escopo |
| react-query (TanStack) | SWR | Cache + mutations + invalidação mais completos |
| sonner | react-hot-toast | Melhor visual, suporte a shadcn out-of-the-box |
| Evolution API | Twilio / Cloud API | Custo zero por mensagem, self-hosted |
| pdfmake | Puppeteer | Mais leve, sem dependência de browser headless |
| `company_id` discriminador | Schema por tenant | Simples, suficiente para MVP, sem overhead operacional |

---

## 12. Ordem de Desenvolvimento

### Fase 1 — Fundação (Semana 1-2)
1. Setup monorepo (Turborepo + pnpm)
2. Schema Prisma + migrations
3. AuthModule (login, JWT, refresh)
4. TenantGuard + middleware
5. Tela de login (frontend)

### Fase 2 — Core Business (Semana 3-4)
6. LeadsModule (CRUD)
7. PipelineModule (Kanban)
8. WebhooksModule (receber WhatsApp)
9. ConversationsModule + MessagesModule (Inbox)

### Fase 3 — Complementar (Semana 5-6)
10. DashboardModule (métricas)
11. FollowUpModule
12. ReportsModule (PDF)
13. SettingsModule (empresa + usuários)

### Fase 4 — Público e Entrega (Semana 7)
14. Landing page + planos
15. packages/ui (componentes finais)
16. packages/utils (finalizar)
17. Deploy + configuração de domínio

---

*Planejamento gerado em 2026-05-03 · Elyon Hub v1.0 · Natan Sousa Tech*
