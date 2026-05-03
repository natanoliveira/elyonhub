import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CompanyId } from '@/common/decorators/company-id.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Role } from '@prisma/client'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@CompanyId() companyId: string) {
    return this.usersService.findAll(companyId)
  }

  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateUserDto) {
    return this.usersService.create(companyId, dto)
  }

  @Patch(':id')
  update(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(companyId, id, user.id, dto)
  }

  @Delete(':id')
  deactivate(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.usersService.deactivate(companyId, id, user.id)
  }
}
