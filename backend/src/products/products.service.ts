import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType, Product } from '@prisma/client';
import {
  ComputedStockMetrics,
  OperationalStockStatus,
  calculateStockMetrics,
  normalizeCanonicalSku,
} from '../common/stock-calculator.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

export interface EnrichedProductView extends Product, ComputedStockMetrics {}

export interface WarehouseKpiSummary {
  totalSkus: number;
  totalPhysicalUnits: number;
  totalCommittedUnits: number;
  totalAvailableUnits: number;
  criticalStockoutCount: number;
  urgentReorderCount: number;
  healthyCount: number;
  estimatedReplenishmentBudgetUsd: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private enrichProduct(product: Product): EnrichedProductView {
    const metrics = calculateStockMetrics({
      physicalStock: product.physicalStock,
      committedStock: product.committedStock,
      minStock: product.minStock,
      unitCostUsd: product.unitCostUsd,
    });

    return {
      ...product,
      ...metrics,
    };
  }

  async findAll(query: QueryProductsDto): Promise<EnrichedProductView[]> {
    const searchFilter = query.search?.trim();
    const categoryFilter = query.category?.trim();

    const products = await this.prisma.product.findMany({
      where: {
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(searchFilter
          ? {
              OR: [
                { skuCode: { contains: searchFilter, mode: 'insensitive' } },
                { name: { contains: searchFilter, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { skuCode: 'asc' },
    });

    const enriched = products.map((p) => this.enrichProduct(p));

    if (query.onlyAlerts) {
      return enriched.filter((p) => p.needsReplenishment);
    }

    return enriched;
  }

  async getReplenishmentAlerts(): Promise<EnrichedProductView[]> {
    const allProducts = await this.findAll({ onlyAlerts: true });

    const priorityRank: Record<OperationalStockStatus, number> = {
      CRITICO_QUIEBRE_FILA: 1,
      URGENTE_REORDEN: 2,
      SALUDABLE: 3,
    };

    return allProducts.sort(
      (a, b) =>
        priorityRank[a.status] - priorityRank[b.status] ||
        a.availableStock - b.availableStock,
    );
  }

  async getWarehouseKpis(): Promise<WarehouseKpiSummary> {
    const allProducts = await this.findAll({});

    const totalPhysicalUnits = allProducts.reduce(
      (acc, p) => acc + p.physicalStock,
      0,
    );
    const totalCommittedUnits = allProducts.reduce(
      (acc, p) => acc + p.committedStock,
      0,
    );
    const totalAvailableUnits = allProducts.reduce(
      (acc, p) => acc + p.availableStock,
      0,
    );

    const criticalStockoutCount = allProducts.filter(
      (p) => p.status === 'CRITICO_QUIEBRE_FILA',
    ).length;
    const urgentReorderCount = allProducts.filter(
      (p) => p.status === 'URGENTE_REORDEN',
    ).length;
    const healthyCount = allProducts.filter(
      (p) => p.status === 'SALUDABLE',
    ).length;

    const estimatedReplenishmentBudgetUsd = Number(
      allProducts
        .reduce((acc, p) => acc + p.estimatedOrderCostUsd, 0)
        .toFixed(2),
    );

    return {
      totalSkus: allProducts.length,
      totalPhysicalUnits,
      totalCommittedUnits,
      totalAvailableUnits,
      criticalStockoutCount,
      urgentReorderCount,
      healthyCount,
      estimatedReplenishmentBudgetUsd,
    };
  }

  async findBySku(skuCode: string): Promise<
    EnrichedProductView & {
      movements: {
        id: string;
        type: MovementType;
        quantity: number;
        balanceAfter: number;
        referenceDoc: string;
        operator: string;
        notes: string | null;
        createdAt: Date;
      }[];
    }
  > {
    const normalizedSku = normalizeCanonicalSku(skuCode);
    const product = await this.prisma.product.findUnique({
      where: { skuCode: normalizedSku },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        `El producto con SKU "${normalizedSku}" no existe en el catálogo maestro`,
      );
    }

    const enriched = this.enrichProduct(product);
    return {
      ...enriched,
      movements: product.movements,
    };
  }

  /**
   * Alta de SKU en catálogo maestro. Si incluye stock de corte inicial, se registra
   * atómicamente junto a su evento inmutable INITIAL_CUT en el Kardex.
   */
  async create(dto: CreateProductDto): Promise<EnrichedProductView> {
    const normalizedSku = normalizeCanonicalSku(dto.skuCode);

    const existing = await this.prisma.product.findUnique({
      where: { skuCode: normalizedSku },
    });

    if (existing) {
      throw new ConflictException(
        `El código SKU "${normalizedSku}" ya se encuentra registrado en el catálogo`,
      );
    }

    const initialStock = dto.initialPhysicalStock ?? 0;

    const createdProduct = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          skuCode: normalizedSku,
          name: dto.name.trim(),
          category: dto.category.trim(),
          packagingUnit: dto.packagingUnit.trim(),
          physicalStock: initialStock,
          committedStock: 0,
          minStock: dto.minStock,
          unitCostUsd: dto.unitCostUsd,
        },
      });

      if (initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: MovementType.INITIAL_CUT,
            quantity: initialStock,
            balanceAfter: initialStock,
            referenceDoc: 'ALTA-CATALOGO-INICIAL',
            operator: dto.operator?.trim() || 'SISTEMA_ADMIN',
            notes: 'Corte inicial al crear SKU en catálogo maestro',
          },
        });
      }

      return product;
    });

    return this.enrichProduct(createdProduct);
  }
}

