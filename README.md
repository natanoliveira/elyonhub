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

| Módulo | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/login` · `/auth/refresh` · `/auth/logout` |
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
| **Reports** | `GET /reports/leads` · `/reports/conversion` · `/reports/sales` |

---

## Páginas Frontend

| Rota | Descrição |
|------|-----------|
| `/` | Landing page pública com seção de planos |
| `/login` | Autenticação com layout split |
| `/dashboard` | Métricas, gráfico de funil e saudação personalizada |
| `/pipeline` | Kanban com drag & drop entre etapas |
| `/inbox` | Chat estilo WhatsApp Web |
| `/leads` | Listagem com tabela (desktop) / cards (mobile) |
| `/leads/:id` | Detalhe do lead com histórico de pipeline |
| `/follow-up` | Leads aguardando retorno há mais de N dias |
| `/reports` | Geração e download de relatórios PDF |
| `/settings` | Configurações de empresa, usuários e WhatsApp |
| `/profile` | Perfil do usuário: alterar nome e senha |

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
PORT=4004
PRISMA_LOG=false           # true para logar queries SQL
CORS_ORIGINS=http://localhost:3000
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
```

---

## Arquitetura de Segurança

- Senhas com **bcrypt** (12 rounds)
- Access token **JWT HS256** com expiração de 15 minutos
- Refresh token armazenado como **hash SHA-256** no banco, rotacionado a cada uso
- Cookie `accessToken` lido pelo Edge Middleware do Next.js para proteção de rotas
- **RolesGuard** baseado em reflexão — rotas admin requerem `@Roles(Role.ADMIN)`
- Helmet + Throttler configurados na API

---

## Pendências (pós-MVP)

- **T4.3** — Integração de envio via Evolution API (aguardando credenciais)
- Stripe para cobrança de assinaturas
- Testes automatizados (Jest + Playwright)
- Upload de logo para storage (S3/Cloudflare R2)

---

*Elyon Hub v1.0 · © 2026 Natan Sousa Tech · Todos os direitos reservados*
