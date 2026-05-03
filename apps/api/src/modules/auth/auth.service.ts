import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '@/database/prisma.service'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const domain = dto.email.split('@')[1]

    const company = await this.prisma.company.findUnique({
      where: { emailDomain: domain },
    })

    if (!company || !company.active) {
      throw new UnauthorizedException('Empresa não encontrada ou inativa')
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas')
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

    return {
      accessToken,
      refreshToken: rawRefresh,
      user: userInfo,
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
