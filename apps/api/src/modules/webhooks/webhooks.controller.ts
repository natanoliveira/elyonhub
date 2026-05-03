import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { ConfigService } from '@nestjs/config'

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private webhooksService: WebhooksService,
    private config: ConfigService,
  ) {}

  @Post('whatsapp')
  handleWhatsApp(
    @Body() payload: any,
    @Headers('x-webhook-secret') secret: string,
  ) {
    const expected = this.config.get('WEBHOOK_SECRET')
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Webhook secret inválido')
    }
    return this.webhooksService.handleInbound(payload)
  }
}
