import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator'

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  companyName: string

  @IsString()
  @IsNotEmpty()
  emailDomain: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @IsNotEmpty()
  planId: string
}
