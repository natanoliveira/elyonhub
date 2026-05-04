import { IsEnum, IsOptional, IsString } from 'class-validator'
import { FinanceType, FinanceStatus } from '@prisma/client'

export class ListFinanceDto {
  @IsOptional()
  @IsEnum(FinanceType)
  type?: FinanceType

  @IsOptional()
  @IsEnum(FinanceStatus)
  status?: FinanceStatus

  @IsOptional()
  @IsString()
  from?: string

  @IsOptional()
  @IsString()
  to?: string
}
