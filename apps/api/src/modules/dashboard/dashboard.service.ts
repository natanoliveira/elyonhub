import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LeadStatus, PipelineStage, FinanceType } from '@prisma/client'
import { subDays } from 'date-fns'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(companyId: string, from?: string, to?: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    })
    const followUpDays = company?.followUpDays ?? 3

    const dateFilter = {
      gte: from ? new Date(from) : subDays(new Date(), 30),
      lte: to ? new Date(to) : new Date(),
    }

    const hasPro = company?.plan?.name !== 'starter'

    const [total, active, closed, lost, byStage, overdueLeads, financeIncome, financeExpense] = await Promise.all([
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
      hasPro
        ? this.prisma.finance.aggregate({
            where: { companyId, type: FinanceType.INCOME, dueDate: dateFilter },
            _sum: { amount: true },
          })
        : null,
      hasPro
        ? this.prisma.finance.aggregate({
            where: { companyId, type: FinanceType.EXPENSE, dueDate: dateFilter },
            _sum: { amount: true },
          })
        : null,
    ])

    const stageMap = Object.fromEntries(
      Object.values(PipelineStage).map((s) => [s, 0]),
    )
    for (const row of byStage) {
      stageMap[row.pipelineStage] = row._count._all
    }

    const conversionRate =
      closed + lost > 0 ? Math.round((closed / (closed + lost)) * 1000) / 10 : 0

    const incomeTotal = Number(financeIncome?._sum?.amount ?? 0)
    const expenseTotal = Number(financeExpense?._sum?.amount ?? 0)

    return {
      totalLeads: total,
      activeLeads: active,
      closedLeads: closed,
      lostLeads: lost,
      conversionRate,
      leadsByStage: stageMap,
      overdueLeads,
      finance: hasPro
        ? { income: incomeTotal, expense: expenseTotal, balance: incomeTotal - expenseTotal }
        : null,
    }
  }
}
