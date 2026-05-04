import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '@/database/prisma.service'
import { Resend } from 'resend'
import { confirmEmailTemplate } from './templates/confirm-email'
import { resetPasswordTemplate } from './templates/reset-password'

@Injectable()
export class EmailService {
  private resend: Resend
  private from: string
  private readonly logger = new Logger(EmailService.name)

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'))
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
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html: bodyHtml,
        text: bodyText,
      })
    } catch (err) {
      this.logger.warn(`Falha ao enviar e-mail [${type}] para ${to}: ${err?.message}`)
    }

    await this.prisma.emailLog.create({
      data: { to, subject, bodyText, type },
    })
  }
}
