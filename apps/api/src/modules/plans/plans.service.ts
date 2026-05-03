import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })
  }

  async checkUserLimit(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    })
    if (!company) return { allowed: false, current: 0, max: 0 }
    const current = await this.prisma.user.count({ where: { companyId, active: true } })
    return { allowed: current < company.plan.maxUsers, current, max: company.plan.maxUsers }
  }

  async checkLeadLimit(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    })
    if (!company) return { allowed: false, current: 0, max: 0 }
    const current = await this.prisma.lead.count({ where: { companyId } })
    return { allowed: current < company.plan.maxLeads, current, max: company.plan.maxLeads }
  }
}
