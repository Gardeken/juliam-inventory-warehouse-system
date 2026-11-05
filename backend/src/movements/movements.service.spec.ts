import { BadRequestException } from '@nestjs/common';
import { MovementType } from '@prisma/client';
import {
  calculateStockMetrics,
  normalizeCanonicalSku,
} from '../common/stock-calculator.util';
import { computeInventoryBalanceTransition } from './movements.service';

describe('Warehouse Domain Invariants & ACID Transition Rules', () => {
  describe('calculateStockMetrics (Ecuación de Rescate ATP)', () => {
    it('detecta quiebre crítico en fila (ATP = -8) para SKU-002 (20 físico vs 28 comprometido)', () => {
      const result = calculateStockMetrics({
        physicalStock: 20,
        committedStock: 28,
        minStock: 25,
        unitCostUsd: 42.0,
      });

      expect(result.availableStock).toBe(-8);
      expect(result.status).toBe('CRITICO_QUIEBRE_FILA');
      expect(result.needsReplenishment).toBe(true);
      // Target = 25 + 20% (5) = 30. Sugerido = 30 - (-8) = 38 cajas
      expect(result.suggestedOrderQty).toBe(38);
      expect(result.estimatedOrderCostUsd).toBe(1596.0);
    });

    it('marca como URGENTE_REORDEN cuando availableStock <= minStock aunque physicalStock sea alto', () => {
      const result = calculateStockMetrics({
        physicalStock: 31,
        committedStock: 18,
        minStock: 30,
        unitCostUsd: 28.5,
      });

      expect(result.availableStock).toBe(13);
      expect(result.status).toBe('URGENTE_REORDEN');
      expect(result.needsReplenishment).toBe(true);
      expect(result.suggestedOrderQty).toBe(23);
    });

    it('marca como SALUDABLE y sugiere 0 compra cuando availableStock > minStock', () => {
      const result = calculateStockMetrics({
        physicalStock: 42,
        committedStock: 0,
        minStock: 25,
        unitCostUsd: 18.0,
      });

      expect(result.availableStock).toBe(42);
      expect(result.status).toBe('SALUDABLE');
      expect(result.needsReplenishment).toBe(false);
      expect(result.suggestedOrderQty).toBe(0);
    });
  });

  describe('computeInventoryBalanceTransition (Protección de Stock Negativo)', () => {
    it('rechaza cualquier salida (OUT) que supere el physicalStock en piso', () => {
      expect(() =>
        computeInventoryBalanceTransition({
          skuCode: 'SKU-002',
          packagingUnit: 'Caja x1000',
          currentPhysicalStock: 4,
          currentCommittedStock: 12,
          type: MovementType.OUT,
          quantity: 12,
        }),
      ).toThrow(BadRequestException);
    });

    it('descuenta simultáneamente physicalStock y committedStock cuando se despacha una orden de la fila', () => {
      const transition = computeInventoryBalanceTransition({
        skuCode: 'SKU-002',
        packagingUnit: 'Caja x1000',
        currentPhysicalStock: 20,
        currentCommittedStock: 28,
        type: MovementType.OUT,
        quantity: 16,
        fulfillsCommittedOrder: true,
      });

      expect(transition.nextPhysicalStock).toBe(4);
      expect(transition.nextCommittedStock).toBe(12);
    });

    it('incrementa physicalStock correctamente en una entrada de proveedor (IN)', () => {
      const transition = computeInventoryBalanceTransition({
        skuCode: 'SKU-002',
        packagingUnit: 'Caja x1000',
        currentPhysicalStock: 4,
        currentCommittedStock: 12,
        type: MovementType.IN,
        quantity: 38,
      });

      expect(transition.nextPhysicalStock).toBe(42);
      expect(transition.nextCommittedStock).toBe(12);
    });
  });

  describe('normalizeCanonicalSku', () => {
    it('normaliza entradas sucias al formato SKU-XXX', () => {
      expect(normalizeCanonicalSku('sku 001')).toBe('SKU-001');
      expect(normalizeCanonicalSku('006')).toBe('SKU-006');
      expect(normalizeCanonicalSku('SKU_012 ')).toBe('SKU-012');
    });
  });
});
