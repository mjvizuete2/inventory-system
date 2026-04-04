import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";

export class SaleItemInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class SalePaymentInputDto {
  @IsString()
  @MaxLength(30)
  paymentMethod!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class CreateSaleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items!: SaleItemInputDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalePaymentInputDto)
  payments!: SalePaymentInputDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  soldAt?: string;
}
