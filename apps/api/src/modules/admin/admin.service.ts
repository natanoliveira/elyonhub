import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listPlans() {
    return this.prisma.plan.findMany({ orderBy: { price: 'asc' } })
  }

  async updatePlanMenus(planId: string, allowedMenus: string[]) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) throw new NotFoundException('Plano não encontrado')
    return this.prisma.plan.update({ where: { id: planId }, data: { allowedMenus } })
  }

  async listCompanies() {
    const companies = await this.prisma.company.findMany({
      include: {
        plan: { select: { id: true, name: true, price: true } },
        _count: { select: { users: true, leads: true, finances: true, contracts: true } },
        users: {
          where: { role: 'ADMIN' },
          select: { name: true, email: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      emailDomain: c.emailDomain,
      active: c.active,
      createdAt: c.createdAt,
      plan: c.plan,
      adminName: c.users[0]?.name ?? null,
      adminEmail: c.users[0]?.email ?? null,
      usersCount: c._count.users,
      leadsCount: c._count.leads,
      financesCount: c._count.finances,
      contractsCount: c._count.contracts,
    }))
  }

  async updateCompanyPlan(companyId: string, planId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundException('Empresa não encontrada')
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) throw new NotFoundException('Plano não encontrado')
    return this.prisma.company.update({ where: { id: companyId }, data: { planId } })
  }

  async toggleCompanyActive(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundException('Empresa não encontrada')
    return this.prisma.company.update({
      where: { id: companyId },
      data: { active: !company.active },
    })
  }

  async getEmailLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit
    const [logs, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailLog.count(),
    ])
    return { data: logs, total, page, limit }
  }
}
