import { MovementType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMovementDto {
  @IsString()
  @IsNotEmpty({ message: 'El código SKU es obligatorio' })
  @MaxLength(30)
  skuCode!: string;

  @IsEnum(MovementType, {
    message:
      'Tipo de movimiento inválido. Valores permitidos: IN, OUT, SHRINKAGE, COMMIT_ORDER, RELEASE_ORDER',
  })
  type!: MovementType;

  @Type(() => Number)
  @IsInt({
    message:
      'Bloqueo Poka-Yoke: La cantidad debe ser un número entero (sin decimales ni texto)',
  })
  @Min(1, {
    message: 'Bloqueo Poka-Yoke: La cantidad debe ser estrictamente mayor a 0',
  })
  quantity!: number;

  @IsString()
  @IsNotEmpty({
    message:
      'El documento de referencia (Orden de Compra, Factura o Acta) es obligatorio para trazabilidad',
  })
  @MaxLength(80)
  referenceDoc!: string;

  @IsString()
  @IsNotEmpty({ message: 'El identificador del operario responsable es obligatorio' })
  @MaxLength(80)
  operator!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  notes?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  fulfillsCommittedOrder?: boolean;
}

