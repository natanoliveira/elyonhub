import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MASTER)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('plans')
  listPlans() {
    return this.adminService.listPlans()
  }

  @Patch('plans/:id/menus')
  updateMenus(@Param('id') id: string, @Body() body: { allowedMenus: string[] }) {
    return this.adminService.updatePlanMenus(id, body.allowedMenus)
  }

  @Get('companies')
  listCompanies() {
    return this.adminService.listCompanies()
  }

  @Patch('companies/:id/plan')
  updateCompanyPlan(@Param('id') id: string, @Body() body: { planId: string }) {
    return this.adminService.updateCompanyPlan(id, body.planId)
  }

  @Patch('companies/:id/toggle')
  toggleCompany(@Param('id') id: string) {
    return this.adminService.toggleCompanyActive(id)
  }

  @Get('email-logs')
  emailLogs(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.adminService.getEmailLogs(Number(page), Number(limit))
  }
}
