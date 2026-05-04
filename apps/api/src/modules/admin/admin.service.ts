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
    return this.prisma.plan.update({
      where: { id: planId },
      data: { allowedMenus },
    })
  }
}
