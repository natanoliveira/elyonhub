import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { MessageDirection } from '@prisma/client'

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async saveInbound(conversationId: string, body: string, externalId?: string) {
    return this.prisma.message.create({
      data: {
        conversationId,
        direction: MessageDirection.INBOUND,
        body,
        externalId: externalId ?? undefined,
      },
    })
  }

  async saveOutbound(conversationId: string, body: string) {
    return this.prisma.message.create({
      data: {
        conversationId,
        direction: MessageDirection.OUTBOUND,
        body,
      },
    })
  }
}
