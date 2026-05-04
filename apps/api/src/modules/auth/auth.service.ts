import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '@/database/prisma.service'
import { EmailService } from '../email/email.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import * as dns from 'dns'

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.com.br',
  'outlook.com', 'outlook.com.br', 'live.com', 'live.com.br',
  'yahoo.com', 'yahoo.com.br', 'icloud.com', 'me.com', 'mac.com',
  'bol.com.br', 'terra.com.br', 'uol.com.br', 'ig.com.br', 'r7.com',
  'msn.com', 'protonmail.com', 'proton.me', 'tutanota.com',
])

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  // ─── Validação de domínio ──────────────────────────────────────────────────

  async validateDomain(domain: string): Promise<{ valid: boolean; reason?: string }> {
    const clean = domain.toLowerCase().trim()

    if (FREE_EMAIL_DOMAINS.has(clean)) {
      return { valid: false, reason: 'Use o domínio da sua empresa, não um e-mail pessoal.' }
    }

    try {
      const records = await dns.promises.resolveMx(clean)
      if (!records || records.length === 0) {
        return { valid: false, reason: 'Este domínio não possui configuração de e-mail (MX).' }
      }
      return { valid: true }
    } catch {
      return { valid: false, reason: 'Domínio inválido ou sem configuração de e-mail (MX).' }
    }
  }

  // ─── Cadastro ──────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const domain = dto.email.split('@')[1]

    if (domain !== dto.emailDomain) {
      throw new BadRequestException('O e-mail deve pertencer ao domínio informado da empresa.')
    }

    const validation = await this.validateDomain(dto.emailDomain)
    if (!validation.valid) {
      throw new BadRequestException(validation.reason)
    }

    const existingCompany = await this.prisma.company.findUnique({
      where: { emailDomain: dto.emailDomain },
    })
    if (existingCompany) {
      throw new ConflictException('Este domínio já está cadastrado.')
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso.')
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } })
    if (!plan) throw new NotFoundException('Plano não encontrado.')

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const verificationToken = crypto.randomUUID()

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        emailDomain: dto.emailDomain,
        planId: dto.planId,
      },
    })

    await this.prisma.user.create({
      data: {
        companyId: company.id,
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: 'ADMIN',
        isVerified: false,
        verificationToken,
      },
    })

    await this.email.sendConfirmEmail(dto.email, dto.name, verificationToken)

    return { message: 'Conta criada! Verifique seu e-mail para ativar o acesso.' }
  }

  // ─── Confirmação de e-mail ─────────────────────────────────────────────────

  async confirmEmail(token: string) {
    const user = await this.prisma.user.findUnique({ where: { verificationToken: token } })
    if (!user) throw new BadRequestException('Token inválido ou já utilizado.')

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    })

    return { message: 'E-mail confirmado! Você já pode fazer login.' }
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const domain = dto.email.split('@')[1]

    const company = await this.prisma.company.findUnique({
      where: { emailDomain: domain },
    })

    if (!company || !company.active) {
      throw new UnauthorizedException('Empresa não encontrada ou inativa')
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Confirme seu e-mail antes de continuar.')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password)
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    return this.issueTokens(user.id, company.id, user.role, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: company.id,
    })
  }

  // ─── Esqueci a senha ───────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    // Sempre retorna sucesso para não revelar se o e-mail existe
    if (!user) return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções.' }

    const resetToken = crypto.randomUUID()
    const resetTokenAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenAt },
    })

    await this.email.sendResetPassword(user.email, user.name, resetToken)

    return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções.' }
  }

  // ─── Redefinir senha ───────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { resetToken: dto.token } })

    if (!user || !user.resetTokenAt || user.resetTokenAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado.')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, resetToken: null, resetTokenAt: null },
    })

    return { message: 'Senha redefinida com sucesso! Você já pode fazer login.' }
  }

  // ─── Refresh / Logout ──────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken)

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { company: true } } },
    })

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado')
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    })

    return this.issueTokens(stored.user.id, stored.user.companyId, stored.user.role, {
      id: stored.user.id,
      name: stored.user.name,
      email: stored.user.email,
      role: stored.user.role,
      companyId: stored.user.companyId,
    })
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    })
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async issueTokens(userId: string, companyId: string, role: string, userInfo: object) {
    const payload = { sub: userId, companyId, role }

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    })

    const rawRefresh = crypto.randomBytes(64).toString('hex')
    const tokenHash = this.hashToken(rawRefresh)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    })

    return { accessToken, refreshToken: rawRefresh, user: userInfo }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
