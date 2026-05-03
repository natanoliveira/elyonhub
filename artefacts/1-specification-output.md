# Elyon Hub — Especificação Técnica v1.0

> CRM Conversacional SaaS · Multi-tenant · WhatsApp-first  
> Branding: **Natan Sousa Tech**

---

## 1. Visão Geral

O **Elyon Hub** é uma plataforma SaaS multi-tenant que centraliza o atendimento via WhatsApp, organiza leads em pipeline de vendas e automatiza a progressão de negócios. Embora o MVP inicie com foco em energia solar, o sistema é projetado para ser genérico e atender múltiplos nichos.

**Proposta de valor:** Uma empresa contrata o plano, conecta seu WhatsApp, e todos os leads são capturados, organizados e acompanhados automaticamente — sem esforço manual de triagem.

---

## 2. Arquitetura do Sistema

### 2.1 Visão Macro

```
┌─────────────────────────────────────────────────────┐
│                    MONOREPO                         │
│                                                     │
│  ┌──────────────┐        ┌──────────────────────┐  │
│  │  apps/web    │        │    apps/api           │  │
│  │  (Next.js)   │◄──────►│    (NestJS)           │  │
│  └──────────────┘  JWT   └──────────┬───────────┘  │
│                                     │               │
│  ┌──────────────┐        ┌──────────▼───────────┐  │
│  │ packages/ui  │        │    PostgreSQL          │  │
│  │ packages/    │        │    (multi-tenant via  │  │
│  │   utils      │        │     company_id)       │  │
│  └──────────────┘        └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2.2 Stack

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Monorepo    | Turborepo + pnpm workspaces         |
| Backend     | NestJS + TypeScript                 |
| Frontend    | Next.js 14 (App Router) + TypeScript|
| Banco       | PostgreSQL + Prisma ORM             |
| Auth        | JWT (access + refresh tokens)       |
| UI          | Tailwind CSS + shadcn/ui + kibo UI  |
| PDF         | pdfmake                             |
| WhatsApp    | Evolution API (self-hosted)         |

### 2.3 Estrutura do Monorepo

```
elyonhub/
├── apps/
│   ├── web/               # Next.js — frontend
│   └── api/               # NestJS — backend
├── packages/
│   ├── ui/                # componentes compartilhados
│   ├── utils/             # funções utilitárias
│   └── types/             # tipos TypeScript compartilhados
├── artefacts/             # documentação do projeto
├── turbo.json
└── package.json
```

---

## 3. Multi-tenancy

### Estratégia: Discriminador por `company_id`

- Todas as tabelas de negócio possuem coluna `company_id` (FK obrigatória)
- Isolamento garantido em nível de query (guard + middleware no NestJS)
- Identificação da empresa feita automaticamente pelo domínio do email no login
  - Ex: `joao@solarnorte.com.br` → empresa `Solar Norte`
  - Sem slug manual na URL

### Fluxo de identificação

```
Login (email + senha)
     ↓
Extrair domínio do email
     ↓
Buscar company por domínio
     ↓
Emitir JWT com { userId, companyId, role }
     ↓
Todas as requests filtradas por companyId no guard
```

---

## 4. Módulos Funcionais

### 4.1 Autenticação

| Item            | Detalhe                                      |
|-----------------|----------------------------------------------|
| Login           | Email + senha                                |
| Senha           | Hash bcrypt (rounds: 12)                     |
| Token           | JWT access (15min) + refresh token (7 dias)  |
| Empresa         | Identificada pelo domínio do email           |
| Proteção        | Guards NestJS + middleware Next.js           |

**Endpoints:**
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

---

### 4.2 Multiempresa (Companies)

| Campo        | Tipo     | Descrição                          |
|--------------|----------|------------------------------------|
| id           | UUID     | PK                                 |
| name         | string   | Nome da empresa                    |
| email_domain | string   | Domínio para identificação         |
| logo_url     | string   | URL do logotipo                    |
| plan         | enum     | starter \| pro \| scale            |
| active       | boolean  | Status da assinatura               |
| created_at   | datetime |                                    |

---

### 4.3 Usuários

| Campo       | Tipo   | Descrição                          |
|-------------|--------|------------------------------------|
| id          | UUID   |                                    |
| company_id  | UUID   | FK → companies                     |
| name        | string |                                    |
| email       | string | Único global                       |
| password    | string | bcrypt hash                        |
| role        | enum   | admin \| seller                    |
| active      | boolean|                                    |

**Papéis:**
- `admin` — acesso total à empresa (configurações, usuários, relatórios)
- `seller` — acesso ao pipeline, leads e atendimento

---

### 4.4 Leads

| Campo          | Tipo     | Descrição                              |
|----------------|----------|----------------------------------------|
| id             | UUID     |                                        |
| company_id     | UUID     | FK → companies                         |
| name           | string   |                                        |
| phone          | string   | E.164 format                           |
| email          | string   | Opcional                               |
| status         | enum     | active \| closed \| lost               |
| pipeline_stage | enum     | new \| contact \| negotiation \| proposal \| closed \| lost |
| assigned_to    | UUID     | FK → users (vendedor)                  |
| source         | string   | whatsapp \| manual \| import           |
| last_contact   | datetime |                                        |
| created_at     | datetime |                                        |

---

### 4.5 Pipeline

**Etapas (em ordem):**

```
[Novo Lead] → [Contato] → [Negociação] → [Proposta] → [Fechado]
                                                      ↘ [Perdido]
```

**Regras de movimentação automática:**
- Lead responde mensagem → avança de `Novo Lead` para `Contato`
- Mensagem de proposta detectada → avança para `Proposta`
- Movimento manual disponível para admin e seller
- Movimentação registrada em `pipeline_events` com timestamp e autor

**Visão:** Kanban (drag & drop) no frontend

---

### 4.6 Atendimento (WhatsApp Inbox)

| Funcionalidade          | Detalhe                                      |
|-------------------------|----------------------------------------------|
| Inbox                   | Lista de conversas ativas por empresa        |
| Histórico               | Mensagens vinculadas ao lead                 |
| Criação automática      | Novo número → novo lead automaticamente      |
| Interface               | Estilo WhatsApp Web (sidebar + chat)         |
| Envio de mensagens      | Via Evolution API                            |
| Webhook recebimento     | POST /webhooks/whatsapp                      |

**Entidades:**
- `conversations` (conversation por lead)
- `messages` (histórico de mensagens)

---

### 4.7 Follow-up

- Lista de leads sem interação há mais de X dias (configurável por empresa)
- Indicador visual no pipeline (badge de alerta)
- Filtro dedicado na lista de leads
- Critério: `last_contact < now() - interval 'N days'`

---

### 4.8 Dashboard

**Métricas exibidas:**

| Métrica               | Cálculo                                      |
|-----------------------|----------------------------------------------|
| Total de leads        | COUNT por company                            |
| Leads ativos          | status = active                              |
| Taxa de conversão     | closed / (closed + lost) × 100              |
| Leads por etapa       | COUNT GROUP BY pipeline_stage               |
| Receita estimada      | SUM de propostas fechadas                   |
| Leads sem follow-up   | last_contact > threshold                    |

**Período:** últimos 30 dias (padrão), com filtro de período

---

### 4.9 Configuração da Empresa

Acessível apenas para `admin`:

- **Dados da empresa:** nome, logo, domínio de email
- **Usuários:** listar, convidar, editar papel, desativar
- **Pipeline:** customizar nomes das etapas (futuro)
- **Integrações:** token da Evolution API, número WhatsApp
- **Follow-up:** dias de inatividade para alerta (padrão: 3 dias)

---

### 4.10 Relatórios PDF

**Relatórios disponíveis no MVP:**

1. **Relatório de Leads** — lista com nome, etapa, vendedor, data
2. **Relatório de Conversão** — funil com percentuais por etapa
3. **Relatório de Vendas** — leads fechados no período com valores

**Biblioteca:** pdfmake  
**Geração:** server-side no NestJS, retorno como buffer/download

---

### 4.11 Página Pública (Landing Page)

**URL:** `/` (rota pública no Next.js)

**Seções:**
1. Hero — headline + CTA "Começar agora"
2. Como funciona — 3 passos (WhatsApp → Lead → Pipeline)
3. Funcionalidades — cards com features principais
4. Planos — tabela comparativa (ver seção 4.12)
5. Footer — branding Natan Sousa Tech

---

### 4.12 Planos SaaS

| Recurso              | Starter     | Pro          | Scale        |
|----------------------|-------------|--------------|--------------|
| Usuários             | 2           | 10           | Ilimitado    |
| Leads/mês            | 500         | 5.000        | Ilimitado    |
| Conversas WhatsApp   | 1 número    | 3 números    | Ilimitado    |
| Relatórios PDF       | Básico      | Completo     | Completo     |
| Suporte              | Email       | Chat         | Dedicado     |
| Preço                | R$ 97/mês   | R$ 297/mês   | R$ 697/mês   |

---

## 5. Segurança

| Mecanismo           | Implementação                                |
|---------------------|----------------------------------------------|
| Autenticação        | JWT (access + refresh)                       |
| Senha               | bcrypt (rounds 12)                           |
| Isolamento          | `company_id` em todas as queries             |
| Validação inputs    | class-validator (DTOs NestJS)                |
| Proteção de rotas   | Guards NestJS + middleware Next.js           |
| CORS                | Configurado por domínio permitido            |
| Rate limiting       | @nestjs/throttler                            |
| Headers             | helmet (NestJS)                              |

---

## 6. Utilitários (packages/utils)

Módulo compartilhado entre frontend e backend:

```typescript
// utils/date.ts
formatDate(date: Date, format?: string): string
parseDate(str: string): Date
fromNow(date: Date): string          // "há 3 dias"
isOverdue(date: Date, days: number): boolean

// utils/currency.ts
formatBRL(value: number): string     // "R$ 1.234,56"
parseBRL(str: string): number

// utils/document.ts
formatCPF(value: string): string     // "123.456.789-00"
formatCNPJ(value: string): string    // "12.345.678/0001-90"
validateCPF(value: string): boolean
validateCNPJ(value: string): boolean

// utils/phone.ts
formatPhone(value: string): string   // "(11) 99999-9999"
toE164(value: string): string        // "+5511999999999"
validatePhone(value: string): boolean
```

---

## 7. Design System

### 7.1 Paleta de Cores

| Token         | Hex       | Uso                              |
|---------------|-----------|----------------------------------|
| `primary`     | `#553159` | Ações principais, botões         |
| `primary-alt` | `#7D6AA6` | Hover, badges, destaques         |
| `muted`       | `#BDB0D9` | Borders, inputs, backgrounds     |
| `accent`      | `#A68881` | Tags, categorias secundárias     |
| `foreground`  | `#0D0D0D` | Texto principal                  |

### 7.2 Componentes Reutilizáveis (packages/ui)

| Componente    | Variantes                                    |
|---------------|----------------------------------------------|
| Button        | primary, secondary, ghost, destructive       |
| Dialog        | confirm, form, info                          |
| Modal         | full-screen (mobile), centered (desktop)     |
| Table         | sortable, com paginação                      |
| Card          | lead-card, stat-card, plan-card              |
| Toast         | success, error, warning, info                |
| Badge         | status do lead, stage do pipeline            |
| Avatar        | inicial do nome, foto                        |
| KanbanBoard   | colunas arrastáveis                          |
| ChatBubble    | sent, received                               |

### 7.3 UX Guidelines

- **Mobile-first:** todos os layouts pensados a partir de 375px
- **WhatsApp Web:** sidebar de conversas + área de chat principal
- **Pipeline:** Kanban horizontal com scroll lateral no mobile
- **Logout:** botão flutuante fixo no canto inferior direito
- **Skeleton loaders:** em todas as listagens e dashboards
- **Empty states:** ilustração + CTA quando não há dados

---

## 8. Modelo de Dados (ERD Simplificado)

```
companies
  id, name, email_domain, logo_url, plan, active

users
  id, company_id→, name, email, password, role, active

leads
  id, company_id→, name, phone, email, status,
  pipeline_stage, assigned_to→users, source,
  last_contact, created_at

conversations
  id, company_id→, lead_id→, whatsapp_number,
  status, created_at

messages
  id, conversation_id→, direction, body,
  media_url, sent_at

pipeline_events
  id, lead_id→, from_stage, to_stage,
  triggered_by→users, reason, created_at

refresh_tokens
  id, user_id→, token_hash, expires_at, revoked
```

---

## 9. Integrações

### Evolution API (WhatsApp)

- Self-hosted ou cloud
- Webhook `POST /webhooks/whatsapp` recebe mensagens
- SDK/HTTP para envio
- Número de WhatsApp configurado por empresa

### Webhooks

```
POST /webhooks/whatsapp
  ↓
Identificar número do remetente
  ↓
Buscar lead pelo telefone + company_id
  ↓
Se não existe → criar lead automaticamente (stage: new)
  ↓
Salvar mensagem em messages
  ↓
Atualizar last_contact do lead
  ↓
Verificar regras de auto-avanço no pipeline
```

---

## 10. Limites do MVP

O que está **fora** do MVP v1:

- Pagamento online (Stripe/PagSeguro) — planos gerenciados manualmente
- Chatbot / IA automática de respostas
- Múltiplos pipelines por empresa
- App mobile nativo
- Integração com outros canais (Instagram, Telegram)
- Relatórios avançados com gráficos interativos

---

## 11. Critérios de Aceite do MVP

- [ ] Login funcional com identificação automática de empresa
- [ ] Pipeline Kanban com movimentação manual e automática
- [ ] Inbox WhatsApp com histórico de mensagens
- [ ] Criação automática de leads via webhook
- [ ] Dashboard com 5 métricas principais
- [ ] CRUD de usuários por empresa (admin)
- [ ] Geração de pelo menos 1 relatório em PDF
- [ ] Landing page pública com planos
- [ ] Isolamento total entre empresas verificado
- [ ] Funcional em mobile (375px) sem quebras

---

*Especificação gerada em 2026-05-03 · Elyon Hub v1.0 · Natan Sousa Tech*
