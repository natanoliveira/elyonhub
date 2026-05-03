Crie o planejamento técnico de um SaaS CRM multiempresa baseado na especificação fornecida.

---

### DEFINIR

1. Estrutura do monorepo (Turborepo)
2. Organização do backend (NestJS):
   - módulos
   - services
   - controllers
   - guards (auth, tenant)
3. Organização do frontend (Next.js):
   - pages/app router
   - components reutilizáveis
   - hooks
   - services API

---

### BANCO DE DADOS

Modelar tabelas principais:

- users
- companies
- subscriptions
- plans
- leads
- conversations
- messages
- pipeline_stages

---

### MULTI-TENANT

- Implementação via company_id em todas as tabelas
- Middleware para injetar tenant automaticamente

---

### AUTENTICAÇÃO

- JWT
- Refresh token
- Identificação da empresa via email

---

### INTEGRAÇÃO WHATSAPP

- Abstração de provider (ex: Evolution API ou Cloud API)
- Serviço desacoplado

---

### FRONTEND

- Tailwind
- shadcn/ui
- Componentização reutilizável:
  - Dialog
  - Table
  - Card
  - Toast
  - Modal

---

### UTILITÁRIOS

Criar pasta /utils com:
- formatDate
- formatCurrency
- validateCPF/CNPJ
- formatPhone

---

### DEPLOY

- Frontend: Vercel
- Backend: Railway / AWS / DO
- Banco: PostgreSQL

---

Explique todas as decisões de forma simples e prática.