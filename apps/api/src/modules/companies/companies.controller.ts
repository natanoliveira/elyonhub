import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { UpdateCompanyDto, UpdateWhatsAppConfigDto } from './dto/update-company.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CompanyId } from '@/common/decorators/company-id.decorator'
import { Role } from '@prisma/client'

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get('me')
  findMe(@CompanyId() companyId: string) {
    return this.companiesService.findMe(companyId)
  }

  @Patch('me')
  @Roles(Role.ADMIN)
  update(@CompanyId() companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(companyId, dto)
  }

  @Patch('me/whatsapp')
  @Roles(Role.ADMIN)
  updateWhatsApp(@CompanyId() companyId: string, @Body() dto: UpdateWhatsAppConfigDto) {
    return this.companiesService.updateWhatsApp(companyId, dto)
  }
}
