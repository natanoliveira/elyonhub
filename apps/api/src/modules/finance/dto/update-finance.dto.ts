import { IsEnum, IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator'
import { FinanceType, FinanceStatus } from '@prisma/client'

export class UpdateFinanceDto {
  @IsOptional()
  @IsEnum(FinanceType)
  type?: FinanceType

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsEnum(FinanceStatus)
  status?: FinanceStatus

  @IsOptional()
  @IsString()
  category?: string
}
