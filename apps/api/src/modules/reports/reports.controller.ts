import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CompanyId } from '@/common/decorators/company-id.decorator'
import { Role } from '@prisma/client'

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  private sendPDF(res: Response, buffer: Buffer, filename: string) {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    })
    res.end(buffer)
  }

  @Get('leads')
  async leadsReport(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('stage') stage: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateLeadsPDF(companyId, from, to, stage, status)
    this.sendPDF(res, buffer, `leads-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  @Get('conversion')
  async conversionReport(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateConversionPDF(companyId, from, to)
    this.sendPDF(res, buffer, `conversao-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  @Get('sales')
  async salesReport(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateSalesPDF(companyId, from, to)
    this.sendPDF(res, buffer, `vendas-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  @Get('finance')
  async financeReport(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('type') type: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateFinancePDF(companyId, from, to, type, status)
    this.sendPDF(res, buffer, `financeiro-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  @Get('contracts')
  async contractsReport(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateContractsPDF(companyId, from, to, status)
    this.sendPDF(res, buffer, `contratos-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}
