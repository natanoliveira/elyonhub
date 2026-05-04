import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    if (!user) throw new NotFoundException('Usuário não encontrado')
    return user
  }

  async updateMe(userId: string, dto: { name?: string; currentPassword?: string; newPassword?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Usuário não encontrado')

    const data: any = {}

    if (dto.name) data.name = dto.name

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Informe a senha atual para trocar a senha')
      }
      const match = await bcrypt.compare(dto.currentPassword, user.password)
      if (!match) throw new BadRequestException('Senha atual incorreta')
      data.password = await bcrypt.hash(dto.newPassword, 12)
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true },
    })
  }
}
