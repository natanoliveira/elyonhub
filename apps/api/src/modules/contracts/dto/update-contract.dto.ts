import { IsEnum, IsString, IsNumber, IsDateString, IsOptional, IsEmail, Min } from 'class-validator'
import { PaymentType, ContractStatus } from '@prisma/client'

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  clientName?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  document?: string

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  contractValue?: number

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus

  @IsOptional()
  @IsString()
  notes?: string
}
