/// <reference path="./node-builtins.d.ts" />
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface CatalogItem {
  skuCode: string;
  name: string;
  category: string;
  packagingUnit: string;
  initialStock: number;
  minStockAlert: number;
  unitCostUsd: number;
}

export type MovementType = 'CORTE_INICIAL' | 'ENTRADA' | 'SALIDA' | 'AJUSTE_MERMA';

export interface ValidatedMovement {
  timestamp: string;
  skuCode: string;
  eventType: MovementType;
  quantity: number;
  referenceDoc: string;
  operator: string;
  sourceFile: string;
}

export interface PendingOrder {
  orderId: string;
  distributorName: string;
  skuCode: string;
  committedQty: number;
  queuePriority: string;
  arrivalTime: string;
}

export type StockStatus = 'CRITICO_QUIEBRE_FILA' | 'URGENTE_REORDEN' | 'SALUDABLE';

export interface ConsolidatedSkuReport {
  skuCode: string;
  name: string;
  category: string;
  packagingUnit: string;
  initialStock: number;
  totalEntries: number;
  totalExits: number;
  totalShrinkage: number;
  physicalStock: number;
  committedStock: number;
  availableStock: number;
  minStockAlert: number;
  status: StockStatus;
  suggestedOrderQty: number;
  estimatedOrderCostUsd: number;
}

export interface QueueTriageItem {
  orderId: string;
  distributorName: string;
  skuCode: string;
  productName: string;
  requestedQty: number;
  physicalStockBefore: number;
  physicalStockAfter: number;
  dispatchLane: 'CARRIL_RAPIDO_DESPACHABLE' | 'RETENIDO_QUIEBRE_STOCK';
  actionRequired: string;
}

/**
 * Normaliza entradas manuales de SKU ("sku 001", "SKU_002 ", "006") al formato canónico "SKU-XXX".
 */
export function normalizeSku(rawSku: string): string | null {
  const cleaned = rawSku.trim().toUpperCase();
  if (!cleaned) return null;

  const match = cleaned.match(/^(?:SKU[\s_-]*)?(\d{1,4})$/);
  if (!match) return null;

  const numericPart = match[1].padStart(3, '0');
  return `SKU-${numericPart}`;
}

/**
 * Extrae una cantidad entera positiva desde celdas contaminadas con texto (ej. "12 cajas" -> 12).
 * Rechaza valores negativos, ceros o textos sin números válidos ("pendiente").
 */
export function parsePositiveQuantity(rawValue: string): number | null {
  const cleaned = rawValue.trim();
  if (!cleaned) return null;

  if (cleaned.startsWith('-')) {
    return null;
  }

  const match = cleaned.match(/^(\d+)(?:\s+[a-zA-Z0-9_.\s]+)?$/);
  if (!match) return null;

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseCsvRows(csvContent: string): Record<string, string>[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] ?? '').trim();
    });
    return record;
  });
}

function loadCatalog(filePath: string): Map<string, CatalogItem> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsvRows(content);
  const catalog = new Map<string, CatalogItem>();

  for (const row of rows) {
    const skuCode = normalizeSku(row.sku_code);
    if (!skuCode) {
      throw new Error(`SKU inválido en catálogo base: "${row.sku_code}"`);
    }

    catalog.set(skuCode, {
      skuCode,
      name: row.nombre_producto,
      category: row.categoria,
      packagingUnit: row.unidad_empaque,
      initialStock: Number.parseInt(row.stock_inicial_corte, 10),
      minStockAlert: Number.parseInt(row.stock_minimo_alerta, 10),
      unitCostUsd: Number.parseFloat(row.costo_unitario_usd),
    });
  }

  return catalog;
}

function sanitizeMovements(
  filePath: string,
  catalog: Map<string, CatalogItem>,
  auditLogs: string[],
): ValidatedMovement[] {
  const sourceFile = path.basename(filePath);
  const rows = parseCsvRows(fs.readFileSync(filePath, 'utf-8'));
  const validMovements: ValidatedMovement[] = [];

  rows.forEach((row, index) => {
    const lineNum = index + 2;
    const normalizedSku = normalizeSku(row.sku_ingresado);

    if (!normalizedSku || !catalog.has(normalizedSku)) {
      auditLogs.push(
        `[RECHAZADO] ${sourceFile}:L${lineNum} | Operario: ${row.operario} | Motivo: SKU inexistente o malformado ("${row.sku_ingresado}")`,
      );
      return;
    }

    if (row.sku_ingresado.trim() !== normalizedSku) {
      auditLogs.push(
        `[SANITIZADO] ${sourceFile}:L${lineNum} | SKU normalizado de "${row.sku_ingresado}" -> "${normalizedSku}"`,
      );
    }

    const quantity = parsePositiveQuantity(row.cantidad_ingresada);
    if (quantity === null) {
      auditLogs.push(
        `[RECHAZADO] ${sourceFile}:L${lineNum} | SKU: ${normalizedSku} | Operario: ${row.operario} | Motivo: Cantidad inválida o no positiva ("${row.cantidad_ingresada}")`,
      );
      return;
    }

    if (row.cantidad_ingresada.trim() !== String(quantity)) {
      auditLogs.push(
        `[SANITIZADO] ${sourceFile}:L${lineNum} | SKU: ${normalizedSku} | Cantidad extraída de "${row.cantidad_ingresada}" -> ${quantity}`,
      );
    }

    const rawEvent = row.tipo_evento.toUpperCase() as MovementType;
    if (!['ENTRADA', 'SALIDA', 'AJUSTE_MERMA'].includes(rawEvent)) {
      auditLogs.push(
        `[RECHAZADO] ${sourceFile}:L${lineNum} | SKU: ${normalizedSku} | Motivo: Tipo de evento desconocido ("${row.tipo_evento}")`,
      );
      return;
    }

    validMovements.push({
      timestamp: row.fecha_registro,
      skuCode: normalizedSku,
      eventType: rawEvent,
      quantity,
      referenceDoc: row.documento_ref || 'SIN-REF',
      operator: row.operario || 'DESCONOCIDO',
      sourceFile,
    });
  });

  return validMovements;
}

function sanitizePendingOrders(
  filePath: string,
  catalog: Map<string, CatalogItem>,
  auditLogs: string[],
): PendingOrder[] {
  const sourceFile = path.basename(filePath);
  const rows = parseCsvRows(fs.readFileSync(filePath, 'utf-8'));
  const orders: PendingOrder[] = [];

  rows.forEach((row, index) => {
    const lineNum = index + 2;
    const normalizedSku = normalizeSku(row.sku_code);
    const qty = parsePositiveQuantity(row.cantidad_comprometida);

    if (!normalizedSku || !catalog.has(normalizedSku) || qty === null) {
      auditLogs.push(
        `[RECHAZADO] ${sourceFile}:L${lineNum} | Orden ${row.orden_id} ignorada por SKU/cantidad inválida`,
      );
      return;
    }

    if (row.sku_code.trim() !== normalizedSku || row.cantidad_comprometida.trim() !== String(qty)) {
      auditLogs.push(
        `[SANITIZADO] ${sourceFile}:L${lineNum} | Orden ${row.orden_id} normalizada (${normalizedSku}, cant: ${qty})`,
      );
    }

    orders.push({
      orderId: row.orden_id,
      distributorName: row.distribuidor_cliente,
      skuCode: normalizedSku,
      committedQty: qty,
      queuePriority: row.prioridad_fila,
      arrivalTime: row.hora_llegada_almacen,
    });
  });

  return orders;
}

/**
 * Ecuación de rescate operativa:
 * - physicalStock = initialStock + entries - exits - shrinkage
 * - availableStock (ATP) = physicalStock - committedStock
 * - Lote de reabastecimiento incluye cobertura de quiebre + margen de seguridad del 20% sobre el mínimo.
 */
function computeConsolidatedInventory(
  catalog: Map<string, CatalogItem>,
  movements: ValidatedMovement[],
  pendingOrders: PendingOrder[],
): ConsolidatedSkuReport[] {
  const reports: ConsolidatedSkuReport[] = [];

  for (const item of catalog.values()) {
    const skuMovements = movements.filter((m) => m.skuCode === item.skuCode);
    const totalEntries = skuMovements
      .filter((m) => m.eventType === 'ENTRADA')
      .reduce((acc, m) => acc + m.quantity, 0);
    const totalExits = skuMovements
      .filter((m) => m.eventType === 'SALIDA')
      .reduce((acc, m) => acc + m.quantity, 0);
    const totalShrinkage = skuMovements
      .filter((m) => m.eventType === 'AJUSTE_MERMA')
      .reduce((acc, m) => acc + m.quantity, 0);

    const physicalStock = item.initialStock + totalEntries - totalExits - totalShrinkage;
    if (physicalStock < 0) {
      throw new Error(
        `Invariante violada: Stock físico negativo (${physicalStock}) detectado en ${item.skuCode}`,
      );
    }

    const committedStock = pendingOrders
      .filter((o) => o.skuCode === item.skuCode)
      .reduce((acc, o) => acc + o.committedQty, 0);

    const availableStock = physicalStock - committedStock;

    let status: StockStatus = 'SALUDABLE';
    if (availableStock < 0) {
      status = 'CRITICO_QUIEBRE_FILA';
    } else if (availableStock <= item.minStockAlert) {
      status = 'URGENTE_REORDEN';
    }

    const safetyBuffer = Math.ceil(item.minStockAlert * 0.2);
    const targetStockLevel = item.minStockAlert + safetyBuffer;
    const suggestedOrderQty =
      availableStock <= item.minStockAlert ? Math.max(0, targetStockLevel - availableStock) : 0;

    const estimatedOrderCostUsd = Number((suggestedOrderQty * item.unitCostUsd).toFixed(2));

    reports.push({
      skuCode: item.skuCode,
      name: item.name,
      category: item.category,
      packagingUnit: item.packagingUnit,
      initialStock: item.initialStock,
      totalEntries,
      totalExits,
      totalShrinkage,
      physicalStock,
      committedStock,
      availableStock,
      minStockAlert: item.minStockAlert,
      status,
      suggestedOrderQty,
      estimatedOrderCostUsd,
    });
  }

  return reports;
}

function computeQueueTriage(
  catalog: Map<string, CatalogItem>,
  consolidated: ConsolidatedSkuReport[],
  pendingOrders: PendingOrder[],
): QueueTriageItem[] {
  const remainingPhysicalBySku = new Map<string, number>();
  for (const item of consolidated) {
    remainingPhysicalBySku.set(item.skuCode, item.physicalStock);
  }

  return pendingOrders.map((order) => {
    const product = catalog.get(order.skuCode)!;
    const currentPhysical = remainingPhysicalBySku.get(order.skuCode) ?? 0;

    if (currentPhysical >= order.committedQty) {
      const after = currentPhysical - order.committedQty;
      remainingPhysicalBySku.set(order.skuCode, after);
      return {
        orderId: order.orderId,
        distributorName: order.distributorName,
        skuCode: order.skuCode,
        productName: product.name,
        requestedQty: order.committedQty,
        physicalStockBefore: currentPhysical,
        physicalStockAfter: after,
        dispatchLane: 'CARRIL_RAPIDO_DESPACHABLE',
        actionRequired: 'Despachar inmediatamente por Carril Rápido',
      };
    }

    const deficit = order.committedQty - currentPhysical;
    return {
      orderId: order.orderId,
      distributorName: order.distributorName,
      skuCode: order.skuCode,
      productName: product.name,
      requestedQty: order.committedQty,
      physicalStockBefore: currentPhysical,
      physicalStockAfter: currentPhysical,
      dispatchLane: 'RETENIDO_QUIEBRE_STOCK',
      actionRequired: `Faltan ${deficit} (${product.packagingUnit}). Ofrecer entrega parcial de ${currentPhysical} o reprogramar`,
    };
  });
}

function runConsolidation(): void {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const rawDir = path.join(currentDir, 'data-sucia');
  const outputDir = path.join(currentDir, 'output');

  fs.mkdirSync(outputDir, { recursive: true });

  const auditLogs: string[] = [];
  const catalog = loadCatalog(path.join(rawDir, 'inventario_base_almacen.csv'));

  const movOp1 = sanitizeMovements(
    path.join(rawDir, 'excel_operario_1_entradas_salidas.csv'),
    catalog,
    auditLogs,
  );
  const movOp2 = sanitizeMovements(
    path.join(rawDir, 'excel_operario_2_movimientos.csv'),
    catalog,
    auditLogs,
  );
  const allMovements = [...movOp1, ...movOp2];

  const pendingOrders = sanitizePendingOrders(
    path.join(rawDir, 'ordenes_compra_pendientes_fila.csv'),
    catalog,
    auditLogs,
  );

  const consolidated = computeConsolidatedInventory(catalog, allMovements, pendingOrders);
  const queueTriage = computeQueueTriage(catalog, consolidated, pendingOrders);

  // 1. Generar URGENTE_orden_reabastecimiento.csv (priorizando quiebres en fila primero)
  const statusWeight: Record<StockStatus, number> = {
    CRITICO_QUIEBRE_FILA: 1,
    URGENTE_REORDEN: 2,
    SALUDABLE: 3,
  };

  const urgentReplenishments = consolidated
    .filter((r) => r.status !== 'SALUDABLE')
    .sort((a, b) => statusWeight[a.status] - statusWeight[b.status] || a.availableStock - b.availableStock);

  const replenishmentCsvLines = [
    'prioridad_alerta,sku_code,nombre_producto,categoria,unidad_empaque,stock_fisico_actual,stock_comprometido_fila,stock_disponible_real_atp,stock_minimo_alerta,cantidad_sugerida_pedir,costo_estimado_usd',
    ...urgentReplenishments.map(
      (r) =>
        `${r.status},${r.skuCode},${r.name},${r.category},${r.packagingUnit},${r.physicalStock},${r.committedStock},${r.availableStock},${r.minStockAlert},${r.suggestedOrderQty},${r.estimatedOrderCostUsd.toFixed(2)}`,
    ),
  ];
  fs.writeFileSync(
    path.join(outputDir, 'URGENTE_orden_reabastecimiento.csv'),
    replenishmentCsvLines.join('\n') + '\n',
    'utf-8',
  );

  // 2. Generar inventario_consolidado_limpio.csv
  const consolidatedCsvLines = [
    'sku_code,nombre_producto,categoria,unidad_empaque,corte_inicial,entradas,salidas,mermas,stock_fisico,stock_comprometido,stock_disponible_atp,stock_minimo,estado_operativo,sugerido_compra',
    ...consolidated.map(
      (r) =>
        `${r.skuCode},${r.name},${r.category},${r.packagingUnit},${r.initialStock},${r.totalEntries},${r.totalExits},${r.totalShrinkage},${r.physicalStock},${r.committedStock},${r.availableStock},${r.minStockAlert},${r.status},${r.suggestedOrderQty}`,
    ),
  ];
  fs.writeFileSync(
    path.join(outputDir, 'inventario_consolidado_limpio.csv'),
    consolidatedCsvLines.join('\n') + '\n',
    'utf-8',
  );

  // 3. Generar triaje_fila_despacho.csv para destrabar la puerta del almacén inmediatamente
  const triageCsvLines = [
    'orden_id,distribuidor_cliente,sku_code,nombre_producto,cantidad_solicitada,stock_fisico_antes,stock_fisico_despues,carril_asignado,accion_operativa',
    ...queueTriage.map(
      (t) =>
        `${t.orderId},${t.distributorName},${t.skuCode},${t.productName},${t.requestedQty},${t.physicalStockBefore},${t.physicalStockAfter},${t.dispatchLane},"${t.actionRequired}"`,
    ),
  ];
  fs.writeFileSync(
    path.join(outputDir, 'triaje_fila_despacho.csv'),
    triageCsvLines.join('\n') + '\n',
    'utf-8',
  );

  // 4. Generar inventario_consolidado_seed.json (puente de continuidad hacia Fase B - NestJS/Prisma)
  const seedPayload = {
    generatedAt: '2026-11-04T08:00:00.000Z',
    summary: {
      totalSkus: consolidated.length,
      criticalStockoutCount: consolidated.filter((r) => r.status === 'CRITICO_QUIEBRE_FILA').length,
      urgentReorderCount: consolidated.filter((r) => r.status === 'URGENTE_REORDEN').length,
      healthyCount: consolidated.filter((r) => r.status === 'SALUDABLE').length,
      totalEstimatedReplenishmentUsd: Number(
        urgentReplenishments.reduce((acc, r) => acc + r.estimatedOrderCostUsd, 0).toFixed(2),
      ),
    },
    products: consolidated,
    sanitizedMovements: allMovements,
    pendingOrders,
  };
  fs.writeFileSync(
    path.join(outputDir, 'inventario_consolidado_seed.json'),
    JSON.stringify(seedPayload, null, 2) + '\n',
    'utf-8',
  );

  // 5. Generar auditoria_errores_datos.log
  fs.writeFileSync(
    path.join(outputDir, 'auditoria_errores_datos.log'),
    auditLogs.join('\n') + '\n',
    'utf-8',
  );

  console.log('================================================================');
  console.log(' MOTOR DE CONTINGENCIA OPERATIVA (FASE A) - EJECUCION EXITOSA');
  console.log('================================================================');
  console.log(`- SKUs auditados en catalogo      : ${consolidated.length}`);
  console.log(`- Movimientos validos procesados  : ${allMovements.length}`);
  console.log(`- Incidencias/limpiezas en datos  : ${auditLogs.length}`);
  console.log(
    `- SKUs en QUIEBRE DE FILA (ATP<0) : ${seedPayload.summary.criticalStockoutCount}`,
  );
  console.log(`- SKUs en PUNTO DE REORDEN        : ${seedPayload.summary.urgentReorderCount}`);
  console.log(
    `- Presupuesto compra urgente (USD): $${seedPayload.summary.totalEstimatedReplenishmentUsd.toFixed(2)}`,
  );
  console.log('----------------------------------------------------------------');
  console.log('Archivos generados en fase-a-contingencia/output/:');
  console.log('  1. URGENTE_orden_reabastecimiento.csv');
  console.log('  2. triaje_fila_despacho.csv');
  console.log('  3. inventario_consolidado_limpio.csv');
  console.log('  4. inventario_consolidado_seed.json');
  console.log('  5. auditoria_errores_datos.log');
  console.log('================================================================');
}

runConsolidation();

