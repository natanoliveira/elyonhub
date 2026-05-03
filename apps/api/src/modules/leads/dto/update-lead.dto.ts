import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { LeadStatus } from '@prisma/client'

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus

  @IsOptional()
  @IsUUID()
  assignedTo?: string
}
