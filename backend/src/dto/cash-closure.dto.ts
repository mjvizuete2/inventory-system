import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCashClosureDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  paymentMethod?: string;
}
