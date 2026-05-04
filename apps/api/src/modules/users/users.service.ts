import { Injectable, ConflictException, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    })
    if (!user) throw new NotFoundException('Usuário não encontrado')
    return user
  }

  async create(companyId: string, dto: CreateUserDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    })
    const currentCount = await this.prisma.user.count({ where: { companyId, active: true } })
    if (company && currentCount >= company.plan.maxUsers) {
      throw new HttpException(
        `Limite de ${company.plan.maxUsers} usuários do plano ${company.plan.name} atingido`,
        HttpStatus.PAYMENT_REQUIRED,
      )
    }

    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ConflictException('Email já cadastrado')

    const password = await bcrypt.hash(dto.password, 12)

    return this.prisma.user.create({
      data: { ...dto, password, companyId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    })
  }

  async update(companyId: string, id: string, requestUserId: string, dto: UpdateUserDto) {
    await this.findOne(companyId, id)

    if (id === requestUserId && dto.role !== undefined) {
      throw new BadRequestException('Você não pode alterar seu próprio papel')
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, role: true, active: true },
    })
  }

  async deactivate(companyId: string, id: string, requestUserId: string) {
    if (id === requestUserId) {
      throw new BadRequestException('Você não pode desativar sua própria conta')
    }
    await this.findOne(companyId, id)
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, active: true },
    })
  }
}
