import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common'
import { PipelineService } from './pipeline.service'
import { MoveStageDto } from './dto/move-stage.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CompanyId } from '@/common/decorators/company-id.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

@Controller('pipeline')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private pipelineService: PipelineService) {}

  @Get()
  getBoard(@CompanyId() companyId: string) {
    return this.pipelineService.getBoard(companyId)
  }

  @Patch(':id/stage')
  moveStage(
    @CompanyId() companyId: string,
    @Param('id') leadId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: MoveStageDto,
  ) {
    return this.pipelineService.moveStage(companyId, leadId, dto.stage, user.id, 'manual')
  }

  @Get(':id/history')
  getHistory(@CompanyId() companyId: string, @Param('id') leadId: string) {
    return this.pipelineService.getHistory(companyId, leadId)
  }
}
