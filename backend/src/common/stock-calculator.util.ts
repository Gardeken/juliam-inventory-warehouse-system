export type OperationalStockStatus =
  | 'CRITICO_QUIEBRE_FILA'
  | 'URGENTE_REORDEN'
  | 'SALUDABLE';

export interface StockMetricsInput {
  physicalStock: number;
  committedStock: number;
  minStock: number;
  unitCostUsd: number;
}

export interface ComputedStockMetrics {
  availableStock: number;
  status: OperationalStockStatus;
  needsReplenishment: boolean;
  suggestedOrderQty: number;
  estimatedOrderCostUsd: number;
}

/**
 * Ecuación de rescate de almacén (Dominio Puro):
 * - availableStock (ATP) = physicalStock - committedStock
 * - Punto de reorden activo cuando availableStock <= minStock
 * - Lote sugerido cubre el déficit hasta (minStock + 20% margen de seguridad)
 */
export function calculateStockMetrics(
  input: StockMetricsInput,
): ComputedStockMetrics {
  const availableStock = input.physicalStock - input.committedStock;

  let status: OperationalStockStatus = 'SALUDABLE';
  if (availableStock < 0) {
    status = 'CRITICO_QUIEBRE_FILA';
  } else if (availableStock <= input.minStock) {
    status = 'URGENTE_REORDEN';
  }

  const needsReplenishment = availableStock <= input.minStock;
  const safetyBuffer = Math.ceil(input.minStock * 0.2);
  const targetStockLevel = input.minStock + safetyBuffer;
  const suggestedOrderQty = needsReplenishment
    ? Math.max(0, targetStockLevel - availableStock)
    : 0;

  const estimatedOrderCostUsd = Number(
    (suggestedOrderQty * input.unitCostUsd).toFixed(2),
  );

  return {
    availableStock,
    status,
    needsReplenishment,
    suggestedOrderQty,
    estimatedOrderCostUsd,
  };
}

export function normalizeCanonicalSku(rawSku: string): string {
  const cleaned = rawSku.trim().toUpperCase();
  const match = cleaned.match(/^(?:SKU[\s_-]*)?(\d{1,4})$/);
  if (match) {
    return `SKU-${match[1].padStart(3, '0')}`;
  }
  return cleaned.replace(/\s+/g, '-');
}
