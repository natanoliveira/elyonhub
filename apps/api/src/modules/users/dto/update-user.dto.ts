import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'
import { Role } from '@prisma/client'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
