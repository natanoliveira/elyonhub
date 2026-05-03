import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const starterPlan = await prisma.plan.upsert({
    where: { id: 'plan-starter' },
    update: {},
    create: {
      id: 'plan-starter',
      name: 'starter',
      price: 97,
      maxUsers: 2,
      maxLeads: 500,
      maxNumbers: 1,
      features: ['Pipeline Kanban', 'Inbox WhatsApp', 'Dashboard', 'Relatório básico'],
    },
  })

  await prisma.plan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'pro',
      price: 297,
      maxUsers: 10,
      maxLeads: 5000,
      maxNumbers: 3,
      features: ['Tudo do Starter', 'Relatórios completos', 'Suporte via chat', 'Multi-vendedor'],
    },
  })

  await prisma.plan.upsert({
    where: { id: 'plan-scale' },
    update: {},
    create: {
      id: 'plan-scale',
      name: 'scale',
      price: 697,
      maxUsers: 9999,
      maxLeads: 9999999,
      maxNumbers: 9999,
      features: ['Tudo do Pro', 'Usuários ilimitados', 'Suporte dedicado', 'API personalizada'],
    },
  })

  const company = await prisma.company.upsert({
    where: { emailDomain: 'elyonhub.com.br' },
    update: {},
    create: {
      name: 'Elyon Hub Demo',
      emailDomain: 'elyonhub.com.br',
      planId: starterPlan.id,
      followUpDays: 3,
    },
  })

  const passwordHash = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@elyonhub.com.br' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Admin Demo',
      email: 'admin@elyonhub.com.br',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('Seed concluído.')
  console.log('Login: admin@elyonhub.com.br / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
