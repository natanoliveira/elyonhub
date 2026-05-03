import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ConversationsService } from './conversations.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CompanyId } from '@/common/decorators/company-id.decorator'

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  findAll(@CompanyId() companyId: string) {
    return this.conversationsService.findAll(companyId)
  }

  @Get(':id')
  findOne(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Query('page') page?: string,
  ) {
    return this.conversationsService.findOne(companyId, id, page ? parseInt(page) : 1)
  }
}
