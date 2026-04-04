import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength
} from "class-validator";

export class CreateClientDto {
  @IsString()
  @Length(2, 20)
  documentType!: string;

  @IsString()
  @Length(5, 20)
  identification!: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}

export class UpdateClientDto extends CreateClientDto {}
