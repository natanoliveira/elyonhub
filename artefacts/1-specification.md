Crie a especificação de um SaaS CRM conversacional (WhatsApp-first), multiempresa (multi-tenant), focado em gestão de leads e pipeline de vendas.

O sistema deve ser genérico (multi nicho), apesar de iniciar com foco em energia solar.

### OBJETIVO
Centralizar atendimento via WhatsApp, organizar leads automaticamente em pipeline e aumentar conversão.

---

### ARQUITETURA
- Monorepo
- Backend: Node.js (NestJS)
- Frontend: React (Next.js)
- Banco: PostgreSQL
- Multi-tenant via company_id

---

### REGRAS GERAIS

- Mobile-first (obrigatório)
- UI com Tailwind CSS
- Componentes reutilizáveis com shadcn/ui + kibo UI
- Separação clara de responsabilidades (services, hooks, utils)
- Código escalável e organizado

---

### FUNCIONALIDADES MVP

1. Autenticação
- Login com email e senha
- Identificação automática da empresa via email (slug implícito)
- JWT seguro

2. Multiempresa
- Cada usuário pertence a uma empresa
- Isolamento total por company_id

3. Módulo de Configuração da Empresa
- Nome, logo, cores
- Usuários (admin, vendedor)
- Configuração básica do sistema

4. Atendimento (WhatsApp)
- Inbox de conversas
- Histórico por lead
- Criação automática de leads

5. Pipeline de Leads
- Etapas:
  - Novo Lead
  - Contato
  - Negociação
  - Proposta
  - Fechado / Perdido
- Movimentação automática por interação

6. Leads
- Nome, telefone, status
- Histórico de interações

7. Follow-up
- Lista de leads parados
- Indicador visual

8. Dashboard
- Leads totais
- Vendas
- Conversão

9. Página pública
- Apresentação do sistema
- Planos SaaS
- Branding: Natan Sousa Tech

10. Planos SaaS
- Starter
- Pro
- Scale

---

### UTILITÁRIOS (OBRIGATÓRIO)

Criar módulo de funções reutilizáveis para:
- Datas (format, parse)
- Moeda (BRL)
- CPF/CNPJ (validação e máscara)
- Telefones (formatação BR)

---

### UX/UI

- Interface estilo WhatsApp Web
- Pipeline estilo Kanban
- Botão flutuante de logout (canto inferior direito)
- Design moderno com paleta:

#553159
#7D6AA6
#BDB0D9
#A68881
#0D0D0D

---

### SEGURANÇA

- JWT + refresh token
- Hash de senha (bcrypt)
- Proteção de rotas
- Validação de inputs (DTOs)
- Isolamento por company_id

---

### RELATÓRIOS

- Geração de PDF simples (ex: pdfmake ou puppeteer)
- Relatórios básicos de leads/vendas

---

Gere a especificação clara, organizada e pronta para desenvolvimento.