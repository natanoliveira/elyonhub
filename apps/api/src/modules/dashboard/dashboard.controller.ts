import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CompanyId } from '@/common/decorators/company-id.decorator'

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  getMetrics(
    @CompanyId() companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.getMetrics(companyId, from, to)
  }
}
