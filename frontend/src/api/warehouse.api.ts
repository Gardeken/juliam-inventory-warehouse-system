import {
  CreateMovementPayload,
  KardexMovementItem,
  ProductItem,
  WarehouseKpiSummary,
} from '../types/warehouse';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (Array.isArray(errBody.message)) {
        errorMessage = errBody.message.join('. ');
      } else if (typeof errBody.message === 'string') {
        errorMessage = errBody.message;
      }
    } catch {
      // Fallback al mensaje de estado HTTP
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export async function fetchWarehouseKpis(): Promise<WarehouseKpiSummary> {
  const res = await fetch(`${API_BASE}/products/kpis`);
  return handleJsonResponse<WarehouseKpiSummary>(res);
}

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  onlyAlerts?: boolean;
}): Promise<ProductItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.onlyAlerts) query.set('onlyAlerts', 'true');

  const queryString = query.toString();
  const url = `${API_BASE}/products${queryString ? `?${queryString}` : ''}`;
  const res = await fetch(url);
  return handleJsonResponse<ProductItem[]>(res);
}

export async function fetchMovements(params?: {
  skuCode?: string;
  limit?: number;
}): Promise<KardexMovementItem[]> {
  const query = new URLSearchParams();
  if (params?.skuCode) query.set('skuCode', params.skuCode);
  if (params?.limit) query.set('limit', String(params.limit));

  const queryString = query.toString();
  const url = `${API_BASE}/movements${queryString ? `?${queryString}` : ''}`;
  const res = await fetch(url);
  return handleJsonResponse<KardexMovementItem[]>(res);
}

export async function postInventoryMovement(
  payload: CreateMovementPayload,
): Promise<{
  movement: KardexMovementItem;
  updatedProduct: ProductItem;
}> {
  const res = await fetch(`${API_BASE}/movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(res);
}

export function downloadReplenishmentCsv(products: ProductItem[]): void {
  const urgentItems = products.filter((p) => p.needsReplenishment);
  const headers = [
    'prioridad_alerta',
    'sku_code',
    'nombre_producto',
    'categoria',
    'unidad_empaque',
    'stock_fisico_actual',
    'stock_comprometido_fila',
    'stock_disponible_real_atp',
    'stock_minimo_alerta',
    'cantidad_sugerida_pedir',
    'costo_estimado_usd',
  ];

  const rows = urgentItems.map((p) =>
    [
      p.status,
      p.skuCode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.packagingUnit,
      p.physicalStock,
      p.committedStock,
      p.availableStock,
      p.minStock,
      p.suggestedOrderQty,
      p.estimatedOrderCostUsd.toFixed(2),
    ].join(','),
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `URGENTE_orden_reabastecimiento_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
