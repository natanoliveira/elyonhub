import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { LeadStatus, PipelineStage } from '@prisma/client'

export class ListLeadsDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus

  @IsOptional()
  @IsUUID()
  assignedTo?: string

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  overdue?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20
}
