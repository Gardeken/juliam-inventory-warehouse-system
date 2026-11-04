import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  DollarSign,
} from 'lucide-react';
import { WarehouseKpiSummary } from '../types/warehouse';
import { MetricCard } from './ui/MetricCard';

interface KpiCardsGridProps {
  kpis: WarehouseKpiSummary | null;
  onFilterUrgent: () => void;
}

export function KpiCardsGrid({ kpis, onFilterUrgent }: KpiCardsGridProps) {
  if (!kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="h-32 animate-pulse rounded-lg border border-outline bg-surface p-5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Quiebre en Fila (ATP < 0)"
        value={kpis.criticalStockoutCount}
        subValue="SKUs en riesgo"
        indicator={kpis.criticalStockoutCount > 0 ? 'danger' : 'default'}
        icon={<AlertCircle className="h-5 w-5 text-status-danger" />}
        hint="Órdenes comprometidas sin cobertura física en piso"
        onClick={onFilterUrgent}
      />

      <MetricCard
        label="Punto de Reorden (ATP ≤ Mínimo)"
        value={kpis.urgentReorderCount}
        subValue={`de ${kpis.totalSkus} SKUs`}
        indicator={kpis.urgentReorderCount > 0 ? 'warning' : 'default'}
        icon={<AlertTriangle className="h-5 w-5 text-status-warning" />}
        hint={`${kpis.healthyCount} insumos operando en nivel saludable`}
        onClick={onFilterUrgent}
      />

      <MetricCard
        label="Stock Físico vs. Comprometido"
        value={kpis.totalPhysicalUnits}
        subValue={`/ ${kpis.totalCommittedUnits} en fila`}
        indicator="default"
        icon={<Boxes className="h-5 w-5" />}
        hint={`Balance neto disponible (ATP): ${kpis.totalAvailableUnits} unidades`}
      />

      <MetricCard
        label="Orden de Compra Sugerida"
        value={`$${kpis.estimatedReplenishmentBudgetUsd.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}`}
        subValue="USD"
        indicator="primary"
        icon={<DollarSign className="h-5 w-5 text-primary" />}
        hint="Cubre quiebres + 20% de stock de seguridad"
      />
    </div>
  );
}
