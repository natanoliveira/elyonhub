import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator'
import { LeadSource } from '@prisma/client'

export class CreateLeadDto {
  @IsString()
  name: string

  @IsString()
  phone: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource
}
