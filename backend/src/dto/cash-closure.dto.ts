import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CashClosureSummaryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  paymentMethod?: string;
}

export class OpenCashClosureDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingAmount!: number;
}

export class CloseCashClosureDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reopen?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  nextOpeningAmount?: number;
}
