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
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateLeadsPDF(companyId, from, to)
    this.sendPDF(res, buffer, 'leads.pdf')
  }

  @Get('conversion')
  async conversionReport(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateConversionPDF(companyId, from, to)
    this.sendPDF(res, buffer, 'conversao.pdf')
  }

  @Get('sales')
  async salesReport(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateSalesPDF(companyId, from, to)
    this.sendPDF(res, buffer, 'vendas.pdf')
  }
}
