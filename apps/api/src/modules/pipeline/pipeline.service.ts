import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { PipelineStage, LeadStatus } from '@prisma/client'

@Injectable()
export class PipelineService {
  constructor(private prisma: PrismaService) {}

  async getBoard(companyId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { companyId, status: LeadStatus.ACTIVE },
      include: { assignedUser: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    })

    const board: Record<string, typeof leads> = {
      NEW: [], CONTACT: [], NEGOTIATION: [], PROPOSAL: [], CLOSED: [], LOST: [],
    }

    for (const lead of leads) {
      board[lead.pipelineStage].push(lead)
    }

    return board
  }

  async moveStage(
    companyId: string,
    leadId: string,
    toStage: PipelineStage,
    triggeredBy?: string,
    reason = 'manual',
  ) {
    const lead = await this.prisma.lead.findFirst({ where: { id: leadId, companyId } })
    if (!lead) throw new NotFoundException('Lead não encontrado')

    if (lead.pipelineStage === toStage) return lead

    const [updated] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: leadId },
        data: {
          pipelineStage: toStage,
          status: toStage === PipelineStage.CLOSED
            ? LeadStatus.CLOSED
            : toStage === PipelineStage.LOST
            ? LeadStatus.LOST
            : LeadStatus.ACTIVE,
        },
      }),
      this.prisma.pipelineEvent.create({
        data: {
          leadId,
          fromStage: lead.pipelineStage,
          toStage,
          triggeredBy: triggeredBy ?? null,
          reason,
        },
      }),
    ])

    return updated
  }

  async autoAdvance(lead: { id: string; companyId: string; pipelineStage: PipelineStage }) {
    if (lead.pipelineStage === PipelineStage.NEW) {
      await this.moveStage(lead.companyId, lead.id, PipelineStage.CONTACT, undefined, 'auto_message')
    }
  }

  async getHistory(companyId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id: leadId, companyId } })
    if (!lead) throw new NotFoundException('Lead não encontrado')

    return this.prisma.pipelineEvent.findMany({
      where: { leadId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
