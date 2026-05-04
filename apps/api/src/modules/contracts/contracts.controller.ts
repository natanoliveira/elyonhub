import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ContractsService } from './contracts.service'
import { CreateContractDto } from './dto/create-contract.dto'
import { UpdateContractDto } from './dto/update-contract.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CompanyId } from '@/common/decorators/company-id.decorator'
import { ContractStatus } from '@prisma/client'

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query('status') status?: ContractStatus) {
    return this.contractsService.findAll(companyId, status)
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.contractsService.findOne(companyId, id)
  }

  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateContractDto) {
    return this.contractsService.create(companyId, dto)
  }

  @Patch(':id')
  update(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(companyId, id, dto)
  }
}
