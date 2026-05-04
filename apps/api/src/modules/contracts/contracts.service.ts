import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { ContractStatus } from '@prisma/client'
import { CreateContractDto } from './dto/create-contract.dto'
import { UpdateContractDto } from './dto/update-contract.dto'

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  private async requirePro(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    })
    if (company?.plan.name === 'starter') {
      throw new ForbiddenException('O módulo de Contratos está disponível apenas nos planos Pro e Scale')
    }
  }

  async findAll(companyId: string, status?: ContractStatus) {
    await this.requirePro(companyId)
    return this.prisma.contract.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: { lead: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(companyId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, companyId },
      include: { lead: { select: { id: true, name: true, phone: true } } },
    })
    if (!contract) throw new NotFoundException('Contrato não encontrado')
    return contract
  }

  async create(companyId: string, dto: CreateContractDto) {
    await this.requirePro(companyId)
    return this.prisma.contract.create({
      data: {
        companyId,
        clientName: dto.clientName,
        phone: dto.phone,
        email: dto.email,
        document: dto.document,
        contractValue: dto.contractValue,
        paymentType: dto.paymentType,
        startDate: new Date(dto.startDate),
        leadId: dto.leadId ?? null,
        notes: dto.notes,
      },
    })
  }

  async update(companyId: string, id: string, dto: UpdateContractDto) {
    await this.findOne(companyId, id)
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
      },
    })
  }
}
