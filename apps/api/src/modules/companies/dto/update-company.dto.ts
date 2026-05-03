import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator'

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  logoUrl?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  followUpDays?: number
}

export class UpdateWhatsAppConfigDto {
  @IsOptional()
  @IsString()
  instanceId?: string

  @IsOptional()
  @IsString()
  apiKey?: string

  @IsOptional()
  numbers?: string[]
}
