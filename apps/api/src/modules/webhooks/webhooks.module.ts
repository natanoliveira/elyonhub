import { Module } from '@nestjs/common'
import { WebhooksController } from './webhooks.controller'
import { WebhooksService } from './webhooks.service'
import { LeadsModule } from '@/modules/leads/leads.module'
import { ConversationsModule } from '@/modules/conversations/conversations.module'
import { MessagesModule } from '@/modules/messages/messages.module'
import { PipelineModule } from '@/modules/pipeline/pipeline.module'

@Module({
  imports: [LeadsModule, ConversationsModule, MessagesModule, PipelineModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
