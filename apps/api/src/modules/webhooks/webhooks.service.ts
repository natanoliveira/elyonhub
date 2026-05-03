import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LeadsService } from '@/modules/leads/leads.service'
import { ConversationsService } from '@/modules/conversations/conversations.service'
import { MessagesService } from '@/modules/messages/messages.service'
import { PipelineService } from '@/modules/pipeline/pipeline.service'

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)

  constructor(
    private prisma: PrismaService,
    private leadsService: LeadsService,
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
    private pipelineService: PipelineService,
  ) {}

  async handleInbound(payload: any) {
    try {
      const instanceName: string = payload?.instance ?? payload?.instanceName
      const from: string = payload?.data?.key?.remoteJid?.replace('@s.whatsapp.net', '')
        ?? payload?.from
      const body: string = payload?.data?.message?.conversation ?? payload?.body ?? ''
      const externalId: string = payload?.data?.key?.id ?? payload?.messageId

      if (!instanceName || !from) {
        this.logger.warn('Webhook ignorado: instanceName ou from ausente')
        return { ok: true }
      }

      const company = await this.prisma.company.findFirst({
        where: { whatsappConfig: { path: ['instanceId'], equals: instanceName } },
      })

      if (!company) {
        this.logger.warn(`Empresa não encontrada para instance: ${instanceName}`)
        return { ok: true }
      }

      let lead = await this.leadsService.findByPhone(company.id, from)

      if (!lead) {
        lead = await this.leadsService.createFromWhatsApp(company.id, from)
        this.logger.log(`Lead criado automaticamente: ${from}`)
      }

      const conversation = await this.conversationsService.findOrCreate(
        company.id,
        lead.id,
        instanceName,
      )

      if (body) {
        const exists = externalId
          ? await this.prisma.message.findUnique({ where: { externalId } })
          : null

        if (!exists) {
          await this.messagesService.saveInbound(conversation.id, body, externalId)
        }
      }

      await this.leadsService.updateLastContact(lead.id)
      await this.pipelineService.autoAdvance(lead)
    } catch (error) {
      this.logger.error('Erro ao processar webhook', error)
    }

    return { ok: true }
  }
}
