import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { FinanceStatus, FinanceType, PaymentMethod } from '@prisma/client'
import { CreateFinanceDto } from './dto/create-finance.dto'
import { UpdateFinanceDto } from './dto/update-finance.dto'
import { ListFinanceDto } from './dto/list-finance.dto'

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  private async requirePro(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    })
    if (company?.plan.name === 'starter') {
      throw new ForbiddenException('O módulo Financeiro está disponível apenas nos planos Pro e Scale')
    }
  }

  async findAll(companyId: string, dto: ListFinanceDto) {
    await this.requirePro(companyId)

    const where: any = { companyId }
    if (dto.type) where.type = dto.type
    if (dto.status) where.status = dto.status
    if (dto.from || dto.to) {
      where.dueDate = {
        ...(dto.from ? { gte: new Date(dto.from) } : {}),
        ...(dto.to ? { lte: new Date(dto.to) } : {}),
      }
    }

    const [data, summary] = await Promise.all([
      this.prisma.finance.findMany({
        where,
        include: { payments: { orderBy: { paidAt: 'asc' } } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.finance.groupBy({
        by: ['type'],
        where: { companyId, ...(dto.from || dto.to ? { dueDate: where.dueDate } : {}) },
        _sum: { amount: true },
      }),
    ])

    const income = summary.find((s) => s.type === FinanceType.INCOME)?._sum.amount ?? 0
    const expense = summary.find((s) => s.type === FinanceType.EXPENSE)?._sum.amount ?? 0

    return {
      data,
      summary: {
        income: Number(income),
        expense: Number(expense),
        balance: Number(income) - Number(expense),
      },
    }
  }

  async create(companyId: string, dto: CreateFinanceDto) {
    await this.requirePro(companyId)
    return this.prisma.finance.create({
      data: {
        companyId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        category: dto.category,
      },
    })
  }

  async addPayment(
    companyId: string,
    financeId: string,
    amount: number,
    method: PaymentMethod,
    paidAt?: string,
    notes?: string,
  ) {
    const finance = await this.findOne(companyId, financeId)

    const payment = await this.prisma.financePayment.create({
      data: {
        financeId,
        amount,
        method,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        notes,
      },
    })

    // Recalculate status
    const allPayments = await this.prisma.financePayment.aggregate({
      where: { financeId },
      _sum: { amount: true },
    })
    const paidTotal = Number(allPayments._sum.amount ?? 0)
    const total = Number(finance.amount)

    let status: FinanceStatus
    if (paidTotal >= total) status = FinanceStatus.PAID
    else if (paidTotal > 0) status = FinanceStatus.PARTIAL
    else status = FinanceStatus.PENDING

    await this.prisma.finance.update({ where: { id: financeId }, data: { status } })

    return payment
  }

  async removePayment(companyId: string, financeId: string, paymentId: string) {
    const finance = await this.findOne(companyId, financeId)
    await this.prisma.financePayment.delete({ where: { id: paymentId, financeId } })

    const allPayments = await this.prisma.financePayment.aggregate({
      where: { financeId },
      _sum: { amount: true },
    })
    const paidTotal = Number(allPayments._sum.amount ?? 0)
    const total = Number(finance.amount)

    let status: FinanceStatus
    if (paidTotal >= total) status = FinanceStatus.PAID
    else if (paidTotal > 0) status = FinanceStatus.PARTIAL
    else status = FinanceStatus.PENDING

    await this.prisma.finance.update({ where: { id: financeId }, data: { status } })
    return { ok: true }
  }

  async update(companyId: string, id: string, dto: UpdateFinanceDto) {
    await this.findOne(companyId, id)
    return this.prisma.finance.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
      },
    })
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id)
    return this.prisma.finance.delete({ where: { id } })
  }

  private async findOne(companyId: string, id: string) {
    const record = await this.prisma.finance.findFirst({ where: { id, companyId } })
    if (!record) throw new NotFoundException('Lançamento não encontrado')
    return record
  }
}
