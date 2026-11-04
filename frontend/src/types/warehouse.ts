export type OperationalStockStatus =
  | 'CRITICO_QUIEBRE_FILA'
  | 'URGENTE_REORDEN'
  | 'SALUDABLE';

export type MovementType =
  | 'INITIAL_CUT'
  | 'IN'
  | 'OUT'
  | 'SHRINKAGE'
  | 'COMMIT_ORDER'
  | 'RELEASE_ORDER';

export interface ProductItem {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  packagingUnit: string;
  physicalStock: number;
  committedStock: number;
  minStock: number;
  unitCostUsd: number;
  availableStock: number;
  status: OperationalStockStatus;
  needsReplenishment: boolean;
  suggestedOrderQty: number;
  estimatedOrderCostUsd: number;
  updatedAt: string;
}

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

export interface KardexMovementItem {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  referenceDoc: string;
  operator: string;
  notes: string | null;
  createdAt: string;
  product: {
    skuCode: string;
    name: string;
    category: string;
    packagingUnit: string;
  };
}

export interface CreateMovementPayload {
  skuCode: string;
  type: 'IN' | 'OUT' | 'SHRINKAGE' | 'COMMIT_ORDER' | 'RELEASE_ORDER';
  quantity: number;
  referenceDoc: string;
  operator: string;
  notes?: string;
  fulfillsCommittedOrder?: boolean;
}

