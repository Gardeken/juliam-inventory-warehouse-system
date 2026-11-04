import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El código SKU es obligatorio' })
  @MaxLength(30)
  skuCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @MaxLength(60)
  category!: string;

  @IsString()
  @IsNotEmpty({ message: 'La unidad de empaque comercial es obligatoria' })
  @MaxLength(60)
  packagingUnit!: string;

  @Type(() => Number)
  @IsInt({ message: 'El stock mínimo de alerta debe ser un número entero' })
  @Min(1, { message: 'El stock mínimo de alerta debe ser al menos 1 unidad' })
  minStock!: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'El costo unitario debe ser mayor a 0' })
  unitCostUsd!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El corte inicial debe ser un número entero' })
  @Min(0, { message: 'El corte inicial no puede ser negativo' })
  initialPhysicalStock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  operator?: string;
}
