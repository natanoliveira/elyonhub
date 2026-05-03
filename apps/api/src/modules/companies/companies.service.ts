import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { UpdateCompanyDto, UpdateWhatsAppConfigDto } from './dto/update-company.dto'

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findMe(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    })
    if (!company) throw new NotFoundException('Empresa não encontrada')
    return company
  }

  async findByDomain(domain: string) {
    return this.prisma.company.findUnique({ where: { emailDomain: domain } })
  }

  async update(companyId: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
      include: { plan: true },
    })
  }

  async updateWhatsApp(companyId: string, dto: UpdateWhatsAppConfigDto) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { whatsappConfig: dto as any },
      select: { id: true, whatsappConfig: true },
    })
  }
}
