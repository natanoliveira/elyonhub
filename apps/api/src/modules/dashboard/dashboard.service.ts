import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LeadStatus, PipelineStage } from '@prisma/client'
import { subDays } from 'date-fns'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(companyId: string, from?: string, to?: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    const followUpDays = company?.followUpDays ?? 3

    const dateFilter = {
      gte: from ? new Date(from) : subDays(new Date(), 30),
      lte: to ? new Date(to) : new Date(),
    }

    const [total, active, closed, lost, byStage, overdueLeads] = await Promise.all([
      this.prisma.lead.count({ where: { companyId, createdAt: dateFilter } }),
      this.prisma.lead.count({ where: { companyId, status: LeadStatus.ACTIVE } }),
      this.prisma.lead.count({ where: { companyId, status: LeadStatus.CLOSED } }),
      this.prisma.lead.count({ where: { companyId, status: LeadStatus.LOST } }),
      this.prisma.lead.groupBy({
        by: ['pipelineStage'],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.lead.count({
        where: {
          companyId,
          status: LeadStatus.ACTIVE,
          lastContact: { lt: subDays(new Date(), followUpDays) },
        },
      }),
    ])

    const stageMap = Object.fromEntries(
      Object.values(PipelineStage).map((s) => [s, 0]),
    )
    for (const row of byStage) {
      stageMap[row.pipelineStage] = row._count._all
    }

    const conversionRate =
      closed + lost > 0 ? Math.round((closed / (closed + lost)) * 1000) / 10 : 0

    return {
      totalLeads: total,
      activeLeads: active,
      closedLeads: closed,
      lostLeads: lost,
      conversionRate,
      leadsByStage: stageMap,
      overdueLeads,
    }
  }
}
