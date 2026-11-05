import * as fs from 'node:fs';
import * as path from 'node:path';

// Asegurar carga de DATABASE_URL desde .env si se invoca fuera de Prisma CLI
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === 'function') {
  (process as any).loadEnvFile(envPath);
}

import { MovementType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UNIT_COSTS_BY_SKU: Record<string, number> = {
  'SKU-001': 28.5,
  'SKU-002': 42.0,
  'SKU-003': 34.0,
  'SKU-004': 19.5,
  'SKU-005': 54.0,
  'SKU-006': 22.0,
  'SKU-007': 31.0,
  'SKU-008': 38.5,
  'SKU-009': 46.0,
  'SKU-010': 39.0,
  'SKU-011': 16.5,
  'SKU-012': 18.0,
};

interface PhaseASeedPayload {
  products: {
    skuCode: string;
    name: string;
    category: string;
    packagingUnit: string;
    initialStock: number;
    physicalStock: number;
    committedStock: number;
    minStockAlert: number;
  }[];
  sanitizedMovements: {
    timestamp: string;
    skuCode: string;
    eventType: 'ENTRADA' | 'SALIDA' | 'AJUSTE_MERMA';
    quantity: number;
    referenceDoc: string;
    operator: string;
    sourceFile: string;
  }[];
  pendingOrders: {
    orderId: string;
    distributorName: string;
    skuCode: string;
    committedQty: number;
    queuePriority: string;
    arrivalTime: string;
  }[];
}

function loadPhaseASeedData(): PhaseASeedPayload {
  const phaseAPath = path.resolve(
    __dirname,
    '../../fase-a-contingencia/output/inventario_consolidado_seed.json',
  );
  const localFallbackPath = path.resolve(__dirname, './seed-data.json');

  const targetPath = fs.existsSync(phaseAPath)
    ? phaseAPath
    : localFallbackPath;
  return JSON.parse(fs.readFileSync(targetPath, 'utf-8')) as PhaseASeedPayload;
}

function mapEventType(
  rawType: 'ENTRADA' | 'SALIDA' | 'AJUSTE_MERMA',
): MovementType {
  switch (rawType) {
    case 'ENTRADA':
      return MovementType.IN;
    case 'SALIDA':
      return MovementType.OUT;
    case 'AJUSTE_MERMA':
      return MovementType.SHRINKAGE;
  }
}

async function main(): Promise<void> {
  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(
      `[Seed] Base de datos ya inicializada (${existingCount} SKUs). Omitiendo recarga para preservar movimientos nuevos.`,
    );
    return;
  }

  const seedData = loadPhaseASeedData();

  await prisma.$transaction(async (tx) => {
    const productBySku = new Map<
      string,
      { id: string; runningBalance: number }
    >();

    // 1. Crear los 12 productos gastronómicos con su saldo final auditado y registrar el corte inicial en Kardex
    for (const item of seedData.products) {
      const unitCostUsd = UNIT_COSTS_BY_SKU[item.skuCode] ?? 25.0;

      const created = await tx.product.create({
        data: {
          skuCode: item.skuCode,
          name: item.name,
          category: item.category,
          packagingUnit: item.packagingUnit,
          physicalStock: item.physicalStock,
          committedStock: item.committedStock,
          minStock: item.minStockAlert,
          unitCostUsd,
        },
      });

      productBySku.set(item.skuCode, {
        id: created.id,
        runningBalance: item.initialStock,
      });

      await tx.inventoryMovement.create({
        data: {
          productId: created.id,
          type: MovementType.INITIAL_CUT,
          quantity: item.initialStock,
          balanceAfter: item.initialStock,
          referenceDoc: 'CORTE-BASE-ALMACEN',
          operator: 'AUDITORIA_FASE_A',
          notes: 'Corte inicial migrado desde inventario_base_almacen.csv',
          createdAt: new Date('2026-11-01T08:00:00.000Z'),
        },
      });
    }

    // 2. Reproducir los 16 movimientos sanitizados de los operarios en el Kardex
    for (const mov of seedData.sanitizedMovements) {
      const tracker = productBySku.get(mov.skuCode);
      if (!tracker) continue;

      const mappedType = mapEventType(mov.eventType);
      if (mappedType === MovementType.IN) {
        tracker.runningBalance += mov.quantity;
      } else {
        tracker.runningBalance -= mov.quantity;
      }

      const parsedDate = new Date(mov.timestamp.replace(' ', 'T') + ':00.000Z');

      await tx.inventoryMovement.create({
        data: {
          productId: tracker.id,
          type: mappedType,
          quantity: mov.quantity,
          balanceAfter: tracker.runningBalance,
          referenceDoc: mov.referenceDoc,
          operator: mov.operator,
          notes: `Migrado y sanitizado desde ${mov.sourceFile}`,
          createdAt: Number.isNaN(parsedDate.getTime())
            ? new Date()
            : parsedDate,
        },
      });
    }

    // 3. Registrar las 10 órdenes de compra comprometidas en fila como eventos COMMIT_ORDER
    for (const order of seedData.pendingOrders) {
      const tracker = productBySku.get(order.skuCode);
      if (!tracker) continue;

      await tx.inventoryMovement.create({
        data: {
          productId: tracker.id,
          type: MovementType.COMMIT_ORDER,
          quantity: order.committedQty,
          balanceAfter: tracker.runningBalance,
          referenceDoc: order.orderId,
          operator: 'FILA_DESPACHO',
          notes: `Cliente en fila: ${order.distributorName} (${order.queuePriority}, llegada ${order.arrivalTime})`,
          createdAt: new Date('2026-11-04T07:45:00.000Z'),
        },
      });
    }
  });

  console.log(
    `[Seed] Continuidad Operativa Fase A -> Fase B completada: ${seedData.products.length} SKUs, ${seedData.sanitizedMovements.length} movimientos y ${seedData.pendingOrders.length} órdenes en fila cargadas.`,
  );
}

main()
  .catch((err) => {
    console.error('[Seed] Error al poblar base de datos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
