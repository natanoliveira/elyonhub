import { IsEnum, IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator'
import { FinanceType } from '@prisma/client'

export class CreateFinanceDto {
  @IsEnum(FinanceType)
  type: FinanceType

  @IsString()
  description: string

  @IsNumber()
  @Min(0.01)
  amount: number

  @IsDateString()
  dueDate: string

  @IsOptional()
  @IsString()
  category?: string
}
