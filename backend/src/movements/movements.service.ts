import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryMovement, MovementType, Prisma } from '@prisma/client';
import {
  calculateStockMetrics,
  normalizeCanonicalSku,
} from '../common/stock-calculator.util';
import { PrismaService } from '../prisma/prisma.service';
import { EnrichedProductView } from '../products/products.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';

export interface BalanceTransitionInput {
  skuCode: string;
  packagingUnit: string;
  currentPhysicalStock: number;
  currentCommittedStock: number;
  type: MovementType;
  quantity: number;
  fulfillsCommittedOrder?: boolean;
}

export interface BalanceTransitionResult {
  nextPhysicalStock: number;
  nextCommittedStock: number;
}

/**
 * Función pura de dominio para validar invariantes de stock antes de persistir en el Kardex:
 * - Prohibición absoluta de stock físico negativo en piso (OUT / SHRINKAGE).
 * - Separación y descuento coordinado entre physicalStock y committedStock.
 */
export function computeInventoryBalanceTransition(
  input: BalanceTransitionInput,
): BalanceTransitionResult {
  const {
    skuCode,
    packagingUnit,
    currentPhysicalStock,
    currentCommittedStock,
    type,
    quantity,
    fulfillsCommittedOrder,
  } = input;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new BadRequestException(
      'Bloqueo Poka-Yoke: La cantidad del movimiento debe ser un entero positivo mayor a 0',
    );
  }

  let nextPhysicalStock = currentPhysicalStock;
  let nextCommittedStock = currentCommittedStock;

  switch (type) {
    case MovementType.INITIAL_CUT:
    case MovementType.IN: {
      nextPhysicalStock = currentPhysicalStock + quantity;
      break;
    }

    case MovementType.OUT: {
      if (quantity > currentPhysicalStock) {
        throw new BadRequestException(
          `Bloqueo Poka-Yoke (Stock Negativo Impedido): No se pueden despachar ${quantity} (${packagingUnit}) de ${skuCode}. Stock físico actual en piso: ${currentPhysicalStock}.`,
        );
      }
      nextPhysicalStock = currentPhysicalStock - quantity;

      if (fulfillsCommittedOrder) {
        nextCommittedStock = Math.max(0, currentCommittedStock - quantity);
      }
      break;
    }

    case MovementType.SHRINKAGE: {
      if (quantity > currentPhysicalStock) {
        throw new BadRequestException(
          `Bloqueo Poka-Yoke: La merma reportada (${quantity}) supera el stock físico actual en estantería (${currentPhysicalStock}) para ${skuCode}.`,
        );
      }
      nextPhysicalStock = currentPhysicalStock - quantity;
      break;
    }

    case MovementType.COMMIT_ORDER: {
      nextCommittedStock = currentCommittedStock + quantity;
      break;
    }

    case MovementType.RELEASE_ORDER: {
      if (quantity > currentCommittedStock) {
        throw new BadRequestException(
          `No se pueden liberar ${quantity} unidades comprometidas de ${skuCode} porque solo existen ${currentCommittedStock} comprometidas en fila.`,
        );
      }
      nextCommittedStock = currentCommittedStock - quantity;
      break;
    }
  }

  return {
    nextPhysicalStock,
    nextCommittedStock,
  };
}

export interface MovementTransactionResponse {
  movement: InventoryMovement;
  updatedProduct: EnrichedProductView;
}

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Regla de Negocio Innegociable:
   * Ningún saldo de stock se modifica fuera de esta transacción ACID (Serializable)
   * que actualiza Product y registra simultáneamente el evento inmutable en InventoryMovement.
   */
  async recordMovement(
    dto: CreateMovementDto,
  ): Promise<MovementTransactionResponse> {
    const normalizedSku = normalizeCanonicalSku(dto.skuCode);

    return this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const product = await tx.product.findUnique({
          where: { skuCode: normalizedSku },
        });

        if (!product) {
          throw new NotFoundException(
            `Bloqueo Poka-Yoke: El código SKU "${normalizedSku}" no existe en el Catálogo Maestro.`,
          );
        }

        const { nextPhysicalStock, nextCommittedStock } =
          computeInventoryBalanceTransition({
            skuCode: product.skuCode,
            packagingUnit: product.packagingUnit,
            currentPhysicalStock: product.physicalStock,
            currentCommittedStock: product.committedStock,
            type: dto.type,
            quantity: dto.quantity,
            fulfillsCommittedOrder: dto.fulfillsCommittedOrder,
          });

        const updated = await tx.product.update({
          where: { id: product.id },
          data: {
            physicalStock: nextPhysicalStock,
            committedStock: nextCommittedStock,
          },
        });

        const movement = await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: dto.type,
            quantity: dto.quantity,
            balanceAfter: nextPhysicalStock,
            referenceDoc: dto.referenceDoc.trim(),
            operator: dto.operator.trim(),
            notes: dto.notes?.trim() || null,
          },
        });

        const metrics = calculateStockMetrics({
          physicalStock: updated.physicalStock,
          committedStock: updated.committedStock,
          minStock: updated.minStock,
          unitCostUsd: updated.unitCostUsd,
        });

        return {
          movement,
          updatedProduct: {
            ...updated,
            ...metrics,
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async findAll(query: QueryMovementsDto) {
    const normalizedSku = query.skuCode
      ? normalizeCanonicalSku(query.skuCode)
      : undefined;

    return this.prisma.inventoryMovement.findMany({
      where: {
        ...(query.type ? { type: query.type } : {}),
        ...(normalizedSku
          ? {
              product: {
                skuCode: normalizedSku,
              },
            }
          : {}),
      },
      include: {
        product: {
          select: {
            skuCode: true,
            name: true,
            category: true,
            packagingUnit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 100,
    });
  }
}

