import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common'
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
}
