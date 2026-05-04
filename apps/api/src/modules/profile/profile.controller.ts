import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('me')
  findMe(@CurrentUser() user: { id: string }) {
    return this.profileService.findMe(user.id)
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: { id: string },
    @Body() dto: { name?: string; currentPassword?: string; newPassword?: string },
  ) {
    return this.profileService.updateMe(user.id, dto)
  }
}
