import { IsEnum } from 'class-validator'
import { PipelineStage } from '@prisma/client'

export class MoveStageDto {
  @IsEnum(PipelineStage)
  stage: PipelineStage
}
