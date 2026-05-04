import { PrismaClient, PipelineStage, LeadSource, ConversationStatus, MessageDirection, FinanceType, FinanceStatus, PaymentMethod, PaymentType, ContractStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { subDays, subHours } from 'date-fns'

const prisma = new PrismaClient()

function log(msg: string) {
  console.log(`  ${msg}`)
}

function section(title: string) {
  console.log(`\n▸ ${title}`)
}

async function main() {
  console.log('\n🌱 Iniciando seed...')

  // ─── Planos ─────────────────────────────────────────────────────────────
  section('Planos')

  const starterMenus = ['dashboard', 'pipeline', 'inbox', 'leads', 'follow-up', 'reports', 'settings']
  const proMenus = ['dashboard', 'pipeline', 'inbox', 'leads', 'follow-up', 'finance', 'contracts', 'reports', 'settings']
  const scaleMenus = proMenus

  const starterPlan = await prisma.plan.upsert({
    where: { id: 'plan-starter' },
    update: { allowedMenus: starterMenus },
    create: {
      id: 'plan-starter',
      name: 'starter',
      price: 97,
      maxUsers: 2,
      maxLeads: 500,
      maxNumbers: 1,
      features: ['Pipeline Kanban', 'Inbox WhatsApp', 'Dashboard', 'Relatório básico'],
      allowedMenus: starterMenus,
    },
  })
  log(`✓ Plano Starter (R$ 97 · até ${starterPlan.maxUsers} usuários · ${starterPlan.maxLeads} leads)`)

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan-pro' },
    update: { allowedMenus: proMenus },
    create: {
      id: 'plan-pro',
      name: 'pro',
      price: 297,
      maxUsers: 10,
      maxLeads: 5000,
      maxNumbers: 3,
      features: ['Tudo do Starter', 'Relatórios completos', 'Suporte via chat', 'Multi-vendedor'],
      allowedMenus: proMenus,
    },
  })
  log(`✓ Plano Pro    (R$ 297 · até ${proPlan.maxUsers} usuários · ${proPlan.maxLeads} leads)`)

  const scalePlan = await prisma.plan.upsert({
    where: { id: 'plan-scale' },
    update: { allowedMenus: scaleMenus },
    create: {
      id: 'plan-scale',
      name: 'scale',
      price: 697,
      maxUsers: 9999,
      maxLeads: 9999999,
      maxNumbers: 9999,
      features: ['Tudo do Pro', 'Usuários ilimitados', 'Suporte dedicado', 'API personalizada'],
      allowedMenus: scaleMenus,
    },
  })
  log(`✓ Plano Scale  (R$ 697 · ilimitado)`)

  // ─── Empresa 1: Vendas Pro (plano Pro) ──────────────────────────────────
  section('Empresa 1 — Vendas Pro Ltda (plano Pro)')

  const company1 = await prisma.company.upsert({
    where: { emailDomain: 'vendaspro.com.br' },
    update: {},
    create: {
      name: 'Vendas Pro Ltda',
      emailDomain: 'vendaspro.com.br',
      planId: proPlan.id,
      followUpDays: 3,
    },
  })
  log(`✓ Empresa criada (id: ${company1.id})`)

  const hash = await bcrypt.hash('admin123', 12)
  const sellerHash = await bcrypt.hash('seller123', 12)

  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@vendaspro.com.br' },
    update: {},
    create: { companyId: company1.id, name: 'Natan Silva', email: 'admin@vendaspro.com.br', password: hash, role: 'ADMIN' },
  })
  log(`✓ Admin   → ${admin1.email}  (senha: admin123)`)

  const seller1a = await prisma.user.upsert({
    where: { email: 'joao@vendaspro.com.br' },
    update: {},
    create: { companyId: company1.id, name: 'João Oliveira', email: 'joao@vendaspro.com.br', password: sellerHash, role: 'SELLER' },
  })
  log(`✓ Seller  → ${seller1a.email}  (senha: seller123)`)

  const seller1b = await prisma.user.upsert({
    where: { email: 'maria@vendaspro.com.br' },
    update: {},
    create: { companyId: company1.id, name: 'Maria Santos', email: 'maria@vendaspro.com.br', password: sellerHash, role: 'SELLER' },
  })
  log(`✓ Seller  → ${seller1b.email}  (senha: seller123)`)

  // Leads empresa 1
  const leadsData1 = [
    { name: 'Carlos Andrade',  phone: '11991110001', pipelineStage: PipelineStage.NEGOTIATION, assignedTo: seller1a.id, lastContact: subDays(new Date(), 1) },
    { name: 'Ana Lima',        phone: '11991110002', pipelineStage: PipelineStage.PROPOSAL,    assignedTo: seller1b.id, lastContact: subDays(new Date(), 2) },
    { name: 'Roberto Gomes',   phone: '11991110003', pipelineStage: PipelineStage.CONTACT,     assignedTo: seller1a.id, lastContact: subDays(new Date(), 5) },
    { name: 'Patricia Costa',  phone: '11991110004', pipelineStage: PipelineStage.CLOSED,      assignedTo: seller1b.id, lastContact: subDays(new Date(), 10) },
    { name: 'Marcos Souza',    phone: '11991110005', pipelineStage: PipelineStage.NEW,         assignedTo: null,        lastContact: null },
    { name: 'Fernanda Alves',  phone: '11991110006', pipelineStage: PipelineStage.LOST,        assignedTo: seller1a.id, lastContact: subDays(new Date(), 15) },
    { name: 'Lucas Pereira',   phone: '11991110007', pipelineStage: PipelineStage.NEGOTIATION, assignedTo: seller1b.id, lastContact: subDays(new Date(), 4) },
    { name: 'Beatriz Martins', phone: '11991110008', pipelineStage: PipelineStage.CONTACT,     assignedTo: seller1a.id, lastContact: subDays(new Date(), 6) },
  ]

  log(`\n  Leads (${leadsData1.length}):`)
  const leads1: any[] = []
  for (const l of leadsData1) {
    const lead = await prisma.lead.upsert({
      where: { companyId_phone: { companyId: company1.id, phone: l.phone } },
      update: {},
      create: {
        companyId: company1.id,
        name: l.name,
        phone: l.phone,
        source: LeadSource.WHATSAPP,
        pipelineStage: l.pipelineStage,
        assignedTo: l.assignedTo,
        lastContact: l.lastContact,
      },
    })
    leads1.push(lead)
    log(`  ✓ ${l.name.padEnd(16)} [${l.pipelineStage}]`)
  }

  // Pipeline events empresa 1
  const eventsData1 = [
    { lead: leads1[0], from: PipelineStage.NEW,         to: PipelineStage.CONTACT,     user: seller1a.id, daysAgo: 8 },
    { lead: leads1[0], from: PipelineStage.CONTACT,     to: PipelineStage.NEGOTIATION, user: seller1a.id, daysAgo: 3 },
    { lead: leads1[1], from: PipelineStage.NEW,         to: PipelineStage.CONTACT,     user: seller1b.id, daysAgo: 7 },
    { lead: leads1[1], from: PipelineStage.CONTACT,     to: PipelineStage.NEGOTIATION, user: seller1b.id, daysAgo: 4 },
    { lead: leads1[1], from: PipelineStage.NEGOTIATION, to: PipelineStage.PROPOSAL,    user: seller1b.id, daysAgo: 2 },
    { lead: leads1[3], from: PipelineStage.NEW,         to: PipelineStage.CONTACT,     user: seller1b.id, daysAgo: 20 },
    { lead: leads1[3], from: PipelineStage.CONTACT,     to: PipelineStage.NEGOTIATION, user: seller1b.id, daysAgo: 16 },
    { lead: leads1[3], from: PipelineStage.NEGOTIATION, to: PipelineStage.PROPOSAL,    user: seller1b.id, daysAgo: 13 },
    { lead: leads1[3], from: PipelineStage.PROPOSAL,    to: PipelineStage.CLOSED,      user: seller1b.id, daysAgo: 10 },
  ]

  log(`\n  Eventos de pipeline (${eventsData1.length}):`)
  for (const e of eventsData1) {
    await prisma.pipelineEvent.create({
      data: {
        leadId: e.lead.id,
        fromStage: e.from,
        toStage: e.to,
        triggeredBy: e.user,
        createdAt: subDays(new Date(), e.daysAgo),
      },
    })
    log(`  ✓ ${e.lead.name.padEnd(16)} ${e.from} → ${e.to}`)
  }

  // Conversa + mensagens para Carlos Andrade
  log(`\n  Conversas e mensagens:`)
  const conv1 = await prisma.conversation.upsert({
    where: { id: 'conv-carlos-andrade' },
    update: {},
    create: {
      id: 'conv-carlos-andrade',
      companyId: company1.id,
      leadId: leads1[0].id,
      whatsappNumber: '5511991110001',
      status: ConversationStatus.OPEN,
    },
  })

  const messages1 = [
    { direction: MessageDirection.INBOUND,  body: 'Oi, vi o anúncio de vocês. Quero saber mais sobre o produto.',              sentAt: subHours(new Date(), 48) },
    { direction: MessageDirection.OUTBOUND, body: 'Olá Carlos! Obrigado pelo contato. Posso te explicar tudo. Qual é sua necessidade?', sentAt: subHours(new Date(), 47) },
    { direction: MessageDirection.INBOUND,  body: 'Preciso de uma solução para gerenciar minha equipe de vendas.',              sentAt: subHours(new Date(), 46) },
    { direction: MessageDirection.OUTBOUND, body: 'Perfeito! O Elyon Hub é exatamente isso. Posso te apresentar em uma call?', sentAt: subHours(new Date(), 45) },
    { direction: MessageDirection.INBOUND,  body: 'Claro! Quando você tem disponibilidade?',                                    sentAt: subHours(new Date(), 24) },
    { direction: MessageDirection.OUTBOUND, body: 'Amanhã às 10h ou 14h. Qual prefere?',                                       sentAt: subHours(new Date(), 23) },
  ]
  for (const msg of messages1) {
    await prisma.message.create({ data: { conversationId: conv1.id, ...msg } })
  }
  log(`  ✓ Carlos Andrade  — ${messages1.length} mensagens`)

  // Conversa + mensagens para Ana Lima
  const conv2 = await prisma.conversation.upsert({
    where: { id: 'conv-ana-lima' },
    update: {},
    create: {
      id: 'conv-ana-lima',
      companyId: company1.id,
      leadId: leads1[1].id,
      whatsappNumber: '5511991110002',
      status: ConversationStatus.OPEN,
    },
  })

  const messages2 = [
    { direction: MessageDirection.INBOUND,  body: 'Boa tarde! Recebi uma indicação de vocês.',                        sentAt: subHours(new Date(), 72) },
    { direction: MessageDirection.OUTBOUND, body: 'Boa tarde Ana! Que ótimo. Como podemos ajudar?',                   sentAt: subHours(new Date(), 71) },
    { direction: MessageDirection.INBOUND,  body: 'Quero ver o plano Pro. Tenho uma equipe de 5 vendedores.',         sentAt: subHours(new Date(), 70) },
    { direction: MessageDirection.OUTBOUND, body: 'O Pro é ideal pra você! Já enviei a proposta no seu email.',       sentAt: subHours(new Date(), 48) },
    { direction: MessageDirection.INBOUND,  body: 'Recebi sim. Vou analisar e te retorno até sexta.',                 sentAt: subHours(new Date(), 2) },
  ]
  for (const msg of messages2) {
    await prisma.message.create({ data: { conversationId: conv2.id, ...msg } })
  }
  log(`  ✓ Ana Lima        — ${messages2.length} mensagens`)

  // ─── Financeiro empresa 1 (plano Pro) ───────────────────────────────────
  section('Financeiro — Vendas Pro Ltda')

  const financeData = [
    // Receitas
    { type: FinanceType.INCOME,  description: 'Assinatura plano Pro — Carlos Andrade',   amount: 297.00,   dueDate: subDays(new Date(), 58), status: FinanceStatus.PAID,    paidAt: subDays(new Date(), 57), category: 'Assinaturas' },
    { type: FinanceType.INCOME,  description: 'Assinatura plano Pro — Ana Lima',          amount: 297.00,   dueDate: subDays(new Date(), 45), status: FinanceStatus.PAID,    paidAt: subDays(new Date(), 44), category: 'Assinaturas' },
    { type: FinanceType.INCOME,  description: 'Consultoria de implantação',               amount: 1500.00,  dueDate: subDays(new Date(), 38), status: FinanceStatus.PAID,    paidDaysAgo: 36, category: 'Consultoria',    method: PaymentMethod.PIX },
    { type: FinanceType.INCOME,  description: 'Assinatura plano Starter — Marcos Souza', amount: 97.00,    dueDate: subDays(new Date(), 30), status: FinanceStatus.PAID,    paidDaysAgo: 29, category: 'Assinaturas',    method: PaymentMethod.PIX },
    { type: FinanceType.INCOME,  description: 'Assinatura plano Pro — Patricia Costa',   amount: 297.00,   dueDate: subDays(new Date(), 25), status: FinanceStatus.PAID,    paidDaysAgo: 24, category: 'Assinaturas',    method: PaymentMethod.CARD_CREDIT },
    { type: FinanceType.INCOME,  description: 'Treinamento equipe de vendas',             amount: 800.00,   dueDate: subDays(new Date(), 18), status: FinanceStatus.PAID,    paidDaysAgo: 17, category: 'Consultoria',    method: PaymentMethod.TRANSFER },
    { type: FinanceType.INCOME,  description: 'Renovação anual — Lucas Pereira',          amount: 3564.00,  dueDate: subDays(new Date(), 12), status: FinanceStatus.PAID,    paidDaysAgo: 11, category: 'Assinaturas',    method: PaymentMethod.BOLETO },
    { type: FinanceType.INCOME,  description: 'Assinatura plano Pro — Beatriz Martins',  amount: 297.00,   dueDate: subDays(new Date(), 5),  status: FinanceStatus.PENDING, paidDaysAgo: null, category: 'Assinaturas',  method: null },
    { type: FinanceType.INCOME,  description: 'Assinatura plano Scale — Roberto Gomes',  amount: 697.00,   dueDate: subDays(new Date(), 2),  status: FinanceStatus.PENDING, paidDaysAgo: null, category: 'Assinaturas',  method: null },
    { type: FinanceType.INCOME,  description: 'Consultoria premium — setup personalizado',amount: 2000.00,  dueDate: new Date(),              status: FinanceStatus.PENDING, paidDaysAgo: null, category: 'Consultoria',  method: null },
    // Despesas
    { type: FinanceType.EXPENSE, description: 'Hospedagem cloud (Neon + Vercel)',         amount: 890.00,   dueDate: subDays(new Date(), 55), status: FinanceStatus.PAID,    paidDaysAgo: 54, category: 'Infraestrutura', method: PaymentMethod.TRANSFER },
    { type: FinanceType.EXPENSE, description: 'Campanha Google Ads — Março',              amount: 1500.00,  dueDate: subDays(new Date(), 42), status: FinanceStatus.PAID,    paidDaysAgo: 40, category: 'Marketing',      method: PaymentMethod.PIX },
    { type: FinanceType.EXPENSE, description: 'Ferramentas SaaS (Figma, Linear, Notion)', amount: 350.00,   dueDate: subDays(new Date(), 32), status: FinanceStatus.PAID,    paidDaysAgo: 31, category: 'Software',       method: PaymentMethod.CARD_CREDIT },
    { type: FinanceType.EXPENSE, description: 'Freelancer — design de landing page',      amount: 700.00,   dueDate: subDays(new Date(), 22), status: FinanceStatus.PAID,    paidDaysAgo: 20, category: 'Serviços',       method: PaymentMethod.PIX },
    { type: FinanceType.EXPENSE, description: 'Hospedagem cloud (Neon + Vercel) — Abril', amount: 890.00,   dueDate: subDays(new Date(), 10), status: FinanceStatus.PENDING, paidDaysAgo: null, category: 'Infraestrutura', method: null },
    { type: FinanceType.EXPENSE, description: 'Campanha Meta Ads — Abril',                amount: 2000.00,  dueDate: subDays(new Date(), 6),  status: FinanceStatus.PENDING, paidDaysAgo: null, category: 'Marketing',      method: null },
    { type: FinanceType.EXPENSE, description: 'Conta de energia — escritório',            amount: 280.00,   dueDate: subDays(new Date(), 3),  status: FinanceStatus.PENDING, paidDaysAgo: null, category: 'Operacional',    method: null },
  ]

  log(`\n  Lançamentos (${financeData.length}):`)
  for (const f of financeData) {
    const record = await prisma.finance.create({
      data: {
        companyId: company1.id,
        type: f.type,
        description: f.description,
        amount: f.amount,
        dueDate: f.dueDate,
        status: f.status,
        category: f.category,
      },
    })
    if (f.status === FinanceStatus.PAID && f.paidDaysAgo != null && f.method != null) {
      await prisma.financePayment.create({
        data: {
          financeId: record.id,
          amount: f.amount,
          method: f.method as PaymentMethod,
          paidAt: subDays(new Date(), f.paidDaysAgo as number),
        },
      })
    }
    const sign = f.type === FinanceType.INCOME ? '+' : '-'
    const paid = f.status === FinanceStatus.PAID ? '✓' : '○'
    log(`  ${paid} [${sign}] ${f.description.padEnd(42)} R$ ${f.amount.toFixed(2)}`)
  }

  const totalIncome  = financeData.filter(f => f.type === FinanceType.INCOME).reduce((s, f) => s + f.amount, 0)
  const totalExpense = financeData.filter(f => f.type === FinanceType.EXPENSE).reduce((s, f) => s + f.amount, 0)
  log(`\n  Receitas:  R$ ${totalIncome.toFixed(2)}`)
  log(`  Despesas:  R$ ${totalExpense.toFixed(2)}`)
  log(`  Saldo:     R$ ${(totalIncome - totalExpense).toFixed(2)}`)

  // ─── Contratos empresa 1 ─────────────────────────────────────────────────
  section('Contratos — Vendas Pro Ltda')

  const contractsData = [
    {
      clientName: 'Patricia Costa',
      phone: '11991110004',
      email: 'patricia@email.com',
      document: '123.456.789-00',
      contractValue: 3564.00,
      paymentType: PaymentType.CASH,
      startDate: subDays(new Date(), 10),
      status: ContractStatus.ACTIVE,
      notes: 'Renovação anual do plano Pro',
      leadId: leads1[3].id,
    },
    {
      clientName: 'Ana Lima',
      phone: '11991110002',
      email: 'ana@email.com',
      document: '987.654.321-00',
      contractValue: 3564.00,
      paymentType: PaymentType.FINANCING,
      startDate: subDays(new Date(), 2),
      status: ContractStatus.PENDING,
      notes: 'Proposta enviada — aguardando assinatura',
      leadId: leads1[1].id,
    },
    {
      clientName: 'Carlos Andrade',
      phone: '11991110001',
      email: 'carlos@email.com',
      document: '456.789.123-00',
      contractValue: 297.00,
      paymentType: PaymentType.CARD,
      startDate: subDays(new Date(), 58),
      status: ContractStatus.ACTIVE,
      notes: 'Plano Pro mensal',
      leadId: leads1[0].id,
    },
  ]

  log(`\n  Contratos (${contractsData.length}):`)
  for (const c of contractsData) {
    await prisma.contract.create({
      data: {
        companyId: company1.id,
        leadId: c.leadId,
        clientName: c.clientName,
        phone: c.phone,
        email: c.email,
        document: c.document,
        contractValue: c.contractValue,
        paymentType: c.paymentType,
        startDate: c.startDate,
        status: c.status,
        notes: c.notes,
      },
    })
    log(`  ✓ ${c.clientName.padEnd(20)} [${c.status}]  R$ ${c.contractValue.toFixed(2)}`)
  }

  // ─── Empresa 2: Conecta Tech (plano Starter) ────────────────────────────
  section('Empresa 2 — Conecta Tech (plano Starter)')

  const company2 = await prisma.company.upsert({
    where: { emailDomain: 'conecta.io' },
    update: {},
    create: {
      name: 'Conecta Tech',
      emailDomain: 'conecta.io',
      planId: starterPlan.id,
      followUpDays: 5,
    },
  })
  log(`✓ Empresa criada (id: ${company2.id})`)

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin@conecta.io' },
    update: {},
    create: { companyId: company2.id, name: 'Diego Campos', email: 'admin@conecta.io', password: hash, role: 'ADMIN' },
  })
  log(`✓ Admin   → ${admin2.email}          (senha: admin123)`)

  const seller2 = await prisma.user.upsert({
    where: { email: 'pedro@conecta.io' },
    update: {},
    create: { companyId: company2.id, name: 'Pedro Nunes', email: 'pedro@conecta.io', password: sellerHash, role: 'SELLER' },
  })
  log(`✓ Seller  → ${seller2.email}         (senha: seller123)`)

  const leadsData2 = [
    { name: 'Rafael Torres',  phone: '21991220001', pipelineStage: PipelineStage.NEW,         assignedTo: seller2.id, lastContact: subDays(new Date(), 1) },
    { name: 'Camila Reis',    phone: '21991220002', pipelineStage: PipelineStage.CONTACT,     assignedTo: seller2.id, lastContact: subDays(new Date(), 3) },
    { name: 'Bruno Cardoso',  phone: '21991220003', pipelineStage: PipelineStage.PROPOSAL,    assignedTo: seller2.id, lastContact: subDays(new Date(), 2) },
    { name: 'Julia Ferreira', phone: '21991220004', pipelineStage: PipelineStage.NEGOTIATION, assignedTo: seller2.id, lastContact: subDays(new Date(), 6) },
  ]

  log(`\n  Leads (${leadsData2.length}):`)
  const leads2: any[] = []
  for (const l of leadsData2) {
    const lead = await prisma.lead.upsert({
      where: { companyId_phone: { companyId: company2.id, phone: l.phone } },
      update: {},
      create: {
        companyId: company2.id,
        name: l.name,
        phone: l.phone,
        source: LeadSource.WHATSAPP,
        pipelineStage: l.pipelineStage,
        assignedTo: l.assignedTo,
        lastContact: l.lastContact,
      },
    })
    leads2.push(lead)
    log(`  ✓ ${l.name.padEnd(16)} [${l.pipelineStage}]`)
  }

  const eventsData2 = [
    { lead: leads2[2], from: PipelineStage.NEW,         to: PipelineStage.CONTACT,     user: seller2.id, daysAgo: 10 },
    { lead: leads2[2], from: PipelineStage.CONTACT,     to: PipelineStage.NEGOTIATION, user: seller2.id, daysAgo: 7 },
    { lead: leads2[2], from: PipelineStage.NEGOTIATION, to: PipelineStage.PROPOSAL,    user: seller2.id, daysAgo: 2 },
    { lead: leads2[3], from: PipelineStage.NEW,         to: PipelineStage.CONTACT,     user: seller2.id, daysAgo: 9 },
    { lead: leads2[3], from: PipelineStage.CONTACT,     to: PipelineStage.NEGOTIATION, user: seller2.id, daysAgo: 6 },
  ]

  log(`\n  Eventos de pipeline (${eventsData2.length}):`)
  for (const e of eventsData2) {
    await prisma.pipelineEvent.create({
      data: {
        leadId: e.lead.id,
        fromStage: e.from,
        toStage: e.to,
        triggeredBy: e.user,
        createdAt: subDays(new Date(), e.daysAgo),
      },
    })
    log(`  ✓ ${e.lead.name.padEnd(16)} ${e.from} → ${e.to}`)
  }

  // Conversa + mensagens para Bruno Cardoso
  log(`\n  Conversas e mensagens:`)
  const conv3 = await prisma.conversation.upsert({
    where: { id: 'conv-bruno-cardoso' },
    update: {},
    create: {
      id: 'conv-bruno-cardoso',
      companyId: company2.id,
      leadId: leads2[2].id,
      whatsappNumber: '5521991220003',
      status: ConversationStatus.OPEN,
    },
  })

  const messages3 = [
    { direction: MessageDirection.INBOUND,  body: 'Olá! Quero contratar o plano starter.',                           sentAt: subHours(new Date(), 60) },
    { direction: MessageDirection.OUTBOUND, body: 'Oi Bruno! Seja bem-vindo. Vou te passar os detalhes do Starter.', sentAt: subHours(new Date(), 59) },
    { direction: MessageDirection.INBOUND,  body: 'Quantos leads consigo cadastrar?',                                 sentAt: subHours(new Date(), 58) },
    { direction: MessageDirection.OUTBOUND, body: 'No Starter você tem até 500 leads. Suficiente para começar!',     sentAt: subHours(new Date(), 57) },
    { direction: MessageDirection.INBOUND,  body: 'Perfeito. Me manda a proposta.',                                   sentAt: subHours(new Date(), 48) },
  ]
  for (const msg of messages3) {
    await prisma.message.create({ data: { conversationId: conv3.id, ...msg } })
  }
  log(`  ✓ Bruno Cardoso   — ${messages3.length} mensagens`)

  // ─── Resumo final ────────────────────────────────────────────────────────
  console.log('\n' + '━'.repeat(48))
  console.log('✅ Seed concluído com sucesso!')
  console.log('━'.repeat(48))
  console.log('')
  console.log('  🏢 Vendas Pro Ltda  (plano Pro)')
  console.log('     admin@vendaspro.com.br  /  admin123')
  console.log('     joao@vendaspro.com.br   /  seller123')
  console.log('     maria@vendaspro.com.br  /  seller123')
  console.log('     → 17 lançamentos financeiros  |  3 contratos')
  console.log('')
  console.log('  🏢 Conecta Tech  (plano Starter)')
  console.log('     admin@conecta.io        /  admin123')
  console.log('     pedro@conecta.io        /  seller123')
  console.log('━'.repeat(48) + '\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
