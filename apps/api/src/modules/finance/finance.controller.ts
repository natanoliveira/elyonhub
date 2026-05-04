import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { FinanceService } from './finance.service'
import { CreateFinanceDto } from './dto/create-finance.dto'
import { UpdateFinanceDto } from './dto/update-finance.dto'
import { ListFinanceDto } from './dto/list-finance.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CompanyId } from '@/common/decorators/company-id.decorator'
import { PaymentMethod } from '@prisma/client'

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query() dto: ListFinanceDto) {
    return this.financeService.findAll(companyId, dto)
  }

  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateFinanceDto) {
    return this.financeService.create(companyId, dto)
  }

  @Post(':id/payments')
  addPayment(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: { amount: number; method: PaymentMethod; paidAt?: string; notes?: string },
  ) {
    return this.financeService.addPayment(companyId, id, body.amount, body.method, body.paidAt, body.notes)
  }

  @Delete(':id/payments/:paymentId')
  removePayment(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.financeService.removePayment(companyId, id, paymentId)
  }

  @Patch(':id')
  update(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: UpdateFinanceDto) {
    return this.financeService.update(companyId, id, dto)
  }

  @Delete(':id')
  remove(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.financeService.remove(companyId, id)
  }
}
