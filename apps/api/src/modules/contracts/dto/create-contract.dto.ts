import { IsEnum, IsString, IsNumber, IsDateString, IsOptional, IsEmail, Min } from 'class-validator'
import { PaymentType } from '@prisma/client'

export class CreateContractDto {
  @IsString()
  clientName: string

  @IsString()
  phone: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  document?: string

  @IsNumber()
  @Min(0.01)
  contractValue: number

  @IsEnum(PaymentType)
  paymentType: PaymentType

  @IsDateString()
  startDate: string

  @IsOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @IsString()
  notes?: string
}
