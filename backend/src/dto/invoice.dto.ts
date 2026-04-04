import { IsOptional, IsString, Length } from "class-validator";

export class GenerateInvoiceDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  establishmentCode?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  emissionPointCode?: string;
}
