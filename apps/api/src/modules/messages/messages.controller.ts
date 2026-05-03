import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { SendMessageDto } from './dto/send-message.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post('send')
  send(@Body() dto: SendMessageDto) {
    return this.messagesService.saveOutbound(dto.conversationId, dto.body)
  }
}
