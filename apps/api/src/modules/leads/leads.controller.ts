import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { LeadsService } from './leads.service'
import { CreateLeadDto } from './dto/create-lead.dto'
import { UpdateLeadDto } from './dto/update-lead.dto'
import { ListLeadsDto } from './dto/list-leads.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CompanyId } from '@/common/decorators/company-id.decorator'

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query() dto: ListLeadsDto) {
    return this.leadsService.findAll(companyId, dto)
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.leadsService.findOne(companyId, id)
  }

  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(companyId, dto)
  }

  @Patch(':id')
  update(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(companyId, id, dto)
  }
}
