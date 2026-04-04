import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";
import { Type } from "class-transformer";

export class CreateProductDto {
  @IsString()
  @MaxLength(40)
  sku!: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ivaRate!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProductDto extends CreateProductDto {}
