# Elyon Hub

**CRM conversacional WhatsApp-first para times de vendas.**

Elyon Hub centraliza atendimento, pipeline e métricas em uma única plataforma multi-tenant, convertendo mensagens do WhatsApp em oportunidades de negócio de forma automática.

> Desenvolvido por **Natan Sousa Tech**

---

## Visão Geral

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | NestJS 10 · Prisma ORM · PostgreSQL (Neon) |
| Frontend | Next.js 14 App Router · Tailwind CSS · TanStack Query · Zustand |
| Autenticação | JWT (access 15min + refresh 7d) · bcrypt |
| Email | Brevo (`@getbrevo/brevo` v5) |
| WhatsApp | Evolution API (webhook inbound + envio outbound) |
| Relatórios | pdfmake (geração server-side) |
| UI/UX | dnd-kit (Kanban) · recharts (gráficos) · sonner (toasts) |

---

## Estrutura do Projeto

```
elyonhub/
├── apps/
│   ├── api/          # NestJS — porta 4004
│   └── web/          # Next.js — porta 3000
├── packages/
│   ├── types/        # Enums e tipos compartilhados
│   └── utils/        # Utilitários (data, telefone, formatação)
├── artefacts/        # Documentação de especificação e planejamento
└── turbo.json
```

---

## Módulos Backend

| Módulo | Endpoints principais |
|--------|-----------|
| **Auth** | `POST /auth/login` · `/register` · `/confirm-email` · `/forgot-password` · `/reset-password` · `/validate-domain` |
| **Profile** | `GET /profile/me` · `PATCH /profile/me` |
| **Users** | `GET/POST /users` · `PATCH/DELETE /users/:id` *(admin)* |
| **Companies** | `GET/PATCH /companies/me` · `GET /companies/me/plan` |
| **Plans** | `GET /plans` *(público)* |
| **Leads** | `GET/POST /leads` · `GET/PATCH /leads/:id` |
| **Pipeline** | `GET /pipeline` · `PATCH /pipeline/:id/stage` |
| **Conversations** | `GET /conversations` · `GET /conversations/:id` |
| **Messages** | `POST /messages/send` |
| **Webhooks** | `POST /webhooks/whatsapp` |
| **Dashboard** | `GET /dashboard` |
| **Finance** *(PRO)* | `GET/POST /finance` · `DELETE /finance/:id` · `POST /finance/:id/payments` · `DELETE /finance/:id/payments/:pid` |
| **Contracts** *(PRO)* | `GET/POST /contracts` · `PATCH/DELETE /contracts/:id` |
| **Reports** | `GET /reports/leads` · `/conversion` · `/finance` · `/sales` |
| **Admin** *(MASTER)* | `/admin/menus` · `/admin/companies` · `/admin/email-logs` |

---

## Páginas Frontend

| Rota | Descrição |
|------|-----------|
| `/` | Landing page pública com seção de planos |
| `/login` | Autenticação com layout split |
| `/register` | Cadastro em 3 etapas: plano → empresa (validação MX) → credenciais |
| `/confirm-email` | Ativação de conta via token |
| `/forgot-password` | Solicitação de reset de senha |
| `/reset-password` | Nova senha via token |
| `/dashboard` | Métricas, gráfico de funil e saudação personalizada |
| `/pipeline` | Kanban com drag & drop entre etapas |
| `/inbox` | Chat estilo WhatsApp Web |
| `/leads` | Listagem com tabela (desktop) / cards (mobile) |
| `/leads/:id` | Detalhe do lead com histórico de pipeline |
| `/follow-up` | Leads aguardando retorno há mais de N dias |
| `/finance` | Lançamentos financeiros com pagamentos parciais *(PRO)* |
| `/contracts` | Contratos vinculados a leads *(PRO)* |
| `/reports` | Geração e download de relatórios PDF (5 sub-páginas) |
| `/settings` | Configurações de empresa, usuários e WhatsApp |
| `/profile` | Perfil do usuário: alterar nome e senha |
| `/admin` | Menus por plano *(MASTER)* |
| `/admin/companies` | Gestão de empresas: stats, plano, suspender/reativar *(MASTER)* |
| `/admin/email-logs` | Histórico de e-mails enviados *(MASTER)* |

---

## Módulo Financeiro

O módulo `/finance` suporta lançamentos com **pagamentos parciais**:

- Cada lançamento pode ter múltiplos `FinancePayment` (PIX, cartão, boleto, etc.)
- Status é derivado client-side dos pagamentos reais: `PENDING` → `PARTIAL` → `PAID`
- Modal mestre-detalhe: lista pagamentos + formulário de inserção na mesma tela
- Input de valor com **máscara BRL** (digitar `12345` exibe `123,45`)
- Suporta pagamentos acima do valor (juros, arredondamentos)

### Componentes do módulo

```
apps/web/src/app/(app)/finance/
├── page.tsx                  # Orquestrador (estado + mutations)
├── finance-summary.tsx       # Cards Receitas / Despesas / Saldo
├── finance-filters.tsx       # Selects de filtro
├── finance-table.tsx         # Tabela desktop com collapse readonly
├── finance-cards.tsx         # Cards mobile
├── finance-create-dialog.tsx # Dialog de novo lançamento
├── finance-utils.ts          # paidTotal() + effectiveStatus()
└── payments-modal.tsx        # Modal mestre-detalhe de pagamentos
```

---

## Multi-Tenancy

A empresa é identificada pelo **domínio do email** no momento do login (`email.split('@')[1]`). O `companyId` é embutido no JWT e validado em todas as queries — nenhum dado vaza entre tenants.

---

## Planos

| Plano | Preço | Usuários | Leads | Números |
|-------|-------|----------|-------|---------|
| Starter | R$ 97/mês | 2 | 500 | 1 |
| Pro | R$ 297/mês | 10 | 5.000 | 3 |
| Scale | R$ 697/mês | Ilimitado | Ilimitado | Ilimitado |

Limites são verificados automaticamente ao criar usuários e leads — resposta `402 Payment Required` quando atingido.

---

## Instalação e Execução

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL (ou conta no [Neon](https://neon.tech))

### Setup

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
# Preencher DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

cp apps/web/.env.local.example apps/web/.env.local
# Preencher NEXT_PUBLIC_API_URL=http://localhost:4004

# 3. Criar banco e aplicar schema
pnpm --filter api db:push

# 4. Popular banco com dados de exemplo
pnpm --filter api db:seed

# 5. Iniciar em modo desenvolvimento
pnpm dev
```

### Variáveis de Ambiente — API (`apps/api/.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<64 bytes hex>
JWT_REFRESH_SECRET=<64 bytes hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=4004
PRISMA_LOG=false
CORS_ORIGINS=http://localhost:3000

# Email (Brevo) — opcional em desenvolvimento
BREVO_API_KEY=xkeysib-...
APP_URL=http://localhost:3000
EMAIL_FROM=Elyon Hub <noreply@seudominio.com.br>
```

### Variáveis de Ambiente — Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4004
```

---

## Usuários de Teste (Seed)

Após executar `pnpm --filter api db:seed`:

**Vendas Pro Ltda** — Plano Pro
```
admin@vendaspro.com.br  /  admin123   (Administrador)
joao@vendaspro.com.br   /  seller123  (Vendedor)
maria@vendaspro.com.br  /  seller123  (Vendedor)
```

**Conecta Tech** — Plano Starter
```
admin@conecta.io        /  admin123   (Administrador)
pedro@conecta.io        /  seller123  (Vendedor)
```

---

## Scripts Disponíveis

```bash
pnpm dev                          # Inicia api + web em paralelo
pnpm build                        # Build de todos os pacotes
pnpm --filter api db:push         # Sincroniza schema com o banco
pnpm --filter api db:seed         # Popula banco com dados de teste
pnpm --filter api db:studio       # Abre Prisma Studio
pnpm --filter api db:migrate      # Cria e aplica migration
pnpm --filter api type-check      # Verificação de tipos (API)
pnpm --filter web type-check      # Verificação de tipos (Web)
```

---

## Componentes UI Customizados

| Componente | Localização | Descrição |
|-----------|------------|-----------|
| `Dialog` | `components/ui/dialog.tsx` | Modal com animação de entrada/saída, fecha via `open=false` |
| `Tooltip` | `components/ui/tooltip.tsx` | Tooltip com `position:fixed` — funciona dentro de `overflow:hidden` |
| `Badge` | `components/ui/badge.tsx` | Badge com variantes: success, warning, destructive, secondary |
| `useConfirm` | `components/ui/confirm-dialog.tsx` | Hook para dialogs de confirmação |

---

## Arquitetura de Segurança

- Senhas com **bcrypt** (12 rounds)
- Access token **JWT HS256** com expiração de 15 minutos
- Refresh token armazenado como **hash SHA-256** no banco, rotacionado a cada uso
- Cookie `accessToken` lido pelo Edge Middleware do Next.js para proteção de rotas
- **RolesGuard** baseado em reflexão — rotas admin requerem `@Roles(Role.ADMIN)`
- Helmet + Throttler configurados na API
- Validação de domínio no registro: blocklist de provedores gratuitos + DNS MX lookup

---

## Pendências (pós-MVP)

- **WhatsApp** — Integração Evolution API (aguardando credenciais)
- Stripe para cobrança de assinaturas
- Testes automatizados (Jest + Playwright)
- Upload de logo para storage (S3/Cloudflare R2)

---

*Elyon Hub v1.0 · © 2026 Natan Sousa Tech · Todos os direitos reservados*
