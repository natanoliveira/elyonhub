import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '@/database/prisma.service'
import { BrevoClient } from '@getbrevo/brevo'
import { confirmEmailTemplate } from './templates/confirm-email'
import { resetPasswordTemplate } from './templates/reset-password'

@Injectable()
export class EmailService {
  private client: BrevoClient | undefined
  private from: string
  private readonly logger = new Logger(EmailService.name)

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('BREVO_API_KEY')
    if (apiKey) {
      this.client = new BrevoClient({ apiKey })
    }
    this.from = this.config.get('EMAIL_FROM', 'Elyon Hub <noreply@elyonhub.com.br>')
  }

  async sendConfirmEmail(to: string, name: string, token: string) {
    const appUrl = this.config.get('APP_URL', 'http://localhost:3000')
    const link = `${appUrl}/confirm-email?token=${token}`
    const { subject, bodyText, bodyHtml } = confirmEmailTemplate(name, link)
    await this.send(to, subject, bodyText, bodyHtml, 'confirm-email')
  }

  async sendResetPassword(to: string, name: string, token: string) {
    const appUrl = this.config.get('APP_URL', 'http://localhost:3000')
    const link = `${appUrl}/reset-password?token=${token}`
    const { subject, bodyText, bodyHtml } = resetPasswordTemplate(name, link)
    await this.send(to, subject, bodyText, bodyHtml, 'reset-password')
  }

  private async send(to: string, subject: string, bodyText: string, bodyHtml: string, type: string) {
    if (!this.client) {
      this.logger.warn(`BREVO_API_KEY não configurada — e-mail [${type}] para ${to} ignorado`)
    } else {
      try {
        const [senderName, senderEmail] = this.parseFrom(this.from)
        await this.client.transactionalEmails.sendTransacEmail({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: bodyHtml,
          textContent: bodyText,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        this.logger.warn(`Falha ao enviar e-mail [${type}] para ${to}: ${message}`)
      }
    }

    await this.prisma.emailLog.create({
      data: { to, subject, bodyText, type },
    })
  }

  private parseFrom(from: string): [string, string] {
    const match = from.match(/^(.+?)\s*<(.+?)>$/)
    if (match) return [match[1].trim(), match[2].trim()]
    return ['Elyon Hub', from]
  }
}
