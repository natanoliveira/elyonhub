import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { CreateLeadDto } from './dto/create-lead.dto'
import { UpdateLeadDto } from './dto/update-lead.dto'
import { ListLeadsDto } from './dto/list-leads.dto'
import { subDays } from 'date-fns'
import { LeadSource, PipelineStage } from '@prisma/client'

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, dto: ListLeadsDto) {
    const { search, stage, status, assignedTo, overdue, page = 1, limit = 20 } = dto

    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    const followUpDays = company?.followUpDays ?? 3

    const where: any = { companyId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }
    if (stage) where.pipelineStage = stage
    if (status) where.status = status
    if (assignedTo) where.assignedTo = assignedTo
    if (overdue) {
      where.lastContact = { lt: subDays(new Date(), followUpDays) }
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          assignedUser: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ])

    return { data, meta: { total, page, limit } }
  }

  async findOne(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, companyId },
      include: {
        assignedUser: { select: { id: true, name: true } },
        conversations: { orderBy: { updatedAt: 'desc' }, take: 5 },
        pipelineEvents: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!lead) throw new NotFoundException('Lead não encontrado')
    return lead
  }

  async create(companyId: string, dto: CreateLeadDto) {
    const exists = await this.prisma.lead.findUnique({
      where: { companyId_phone: { companyId, phone: dto.phone } },
    })
    if (exists) throw new ConflictException('Lead com este telefone já existe')

    return this.prisma.lead.create({
      data: {
        ...dto,
        companyId,
        source: dto.source ?? LeadSource.MANUAL,
        lastContact: new Date(),
      },
    })
  }

  async update(companyId: string, id: string, dto: UpdateLeadDto) {
    await this.findOne(companyId, id)
    return this.prisma.lead.update({
      where: { id },
      data: dto,
    })
  }

  async updateLastContact(id: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { lastContact: new Date() },
    })
  }

  async findByPhone(companyId: string, phone: string) {
    return this.prisma.lead.findUnique({
      where: { companyId_phone: { companyId, phone } },
    })
  }

  async createFromWhatsApp(companyId: string, phone: string) {
    return this.prisma.lead.create({
      data: {
        companyId,
        phone,
        name: phone,
        source: LeadSource.WHATSAPP,
        pipelineStage: PipelineStage.NEW,
        lastContact: new Date(),
      },
    })
  }
}
