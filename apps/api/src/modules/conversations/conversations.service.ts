import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { ConversationStatus } from '@prisma/client'

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.conversation.findMany({
      where: { companyId },
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findOne(companyId: string, id: string, page = 1, limit = 50) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, companyId },
      include: { lead: { select: { id: true, name: true, phone: true } } },
    })
    if (!conversation) throw new NotFoundException('Conversa não encontrada')

    const messages = await this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { sentAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { conversation, messages }
  }

  async findOrCreate(companyId: string, leadId: string, whatsappNumber: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { leadId, status: ConversationStatus.OPEN },
    })
    if (existing) return existing

    return this.prisma.conversation.create({
      data: { companyId, leadId, whatsappNumber },
    })
  }
}
