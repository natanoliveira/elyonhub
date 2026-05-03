Implemente um SaaS CRM seguindo as regras:

---

### STACK

- Monorepo com Turborepo
- Backend: NestJS
- Frontend: Next.js
- Banco: PostgreSQL

---

### PADRÕES

- Código limpo
- Separação por camadas
- DTOs para validação
- Services para regras de negócio

---

### BACKEND

Criar:

- AuthModule
- UsersModule
- CompaniesModule
- LeadsModule
- PipelineModule

Com:
- Controllers
- Services
- DTOs
- Guards (Auth + Tenant)

---

### FRONTEND

Criar:

- Layout principal
- Sidebar
- Topbar
- Kanban de leads
- Inbox de mensagens

Componentes:
- Table
- Card
- Dialog
- Toast

---

### REGRAS ESPECIAIS

- Botão logout flutuante (fixed bottom-right)
- Mobile-first
- Design com Tailwind
- Cores definidas no tema

---

### UTILITÁRIOS

Criar funções:

- formatCurrencyBRL()
- formatCPF()
- validateCNPJ()
- formatPhoneBR()
- formatDateBR()

---

### SEGURANÇA

- JWT
- Guards
- Interceptors
- Validação global

---

### RELATÓRIO PDF

- Criar endpoint que gera PDF simples de leads

---

Explique o código enquanto implementa.