import {
  AlertOctagon,
  AlertTriangle,
  Boxes,
  DollarSign,
} from 'lucide-react';
import { WarehouseKpiSummary } from '../types/warehouse';
import { AccentCard } from './ui/AccentCard';

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
            className="h-32 animate-pulse rounded-3xl border border-teal/20 bg-surface-card p-5 shadow-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AccentCard
        tone="coral"
        pulse={kpis.criticalStockoutCount > 0}
        onClick={onFilterUrgent}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-coral-dark">
            Quiebre en Fila (ATP &lt; 0)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral text-white shadow-coral-glow">
            <AlertOctagon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-coral-dark">
            {kpis.criticalStockoutCount}
          </span>
          <span className="text-xs font-bold text-coral-dark/80">
            SKUs en estado BOOM
          </span>
        </div>
        <p className="mt-1.5 text-xs font-medium text-teal-dark/80">
          Requiere triaje en Ventanilla de Incidencias
        </p>
      </AccentCard>

      <AccentCard tone="gold" onClick={onFilterUrgent}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-teal-dark">
            Alerta Punto de Reorden
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-dark/50 bg-gold text-teal-dark shadow-accent-glow">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-teal-dark">
            {kpis.urgentReorderCount}
          </span>
          <span className="text-xs font-bold text-teal-dark/80">
            SKUs con ATP &le; Mínimo
          </span>
        </div>
        <p className="mt-1.5 text-xs font-medium text-teal-dark/80">
          {kpis.healthyCount} de {kpis.totalSkus} SKUs en estado saludable
        </p>
      </AccentCard>

      <AccentCard tone="teal">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-teal-dark">
            Stock Físico vs. Fila
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white shadow-teal-glow">
            <Boxes className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2.5">
          <div>
            <span className="text-2xl font-extrabold text-teal-dark">
              {kpis.totalPhysicalUnits}
            </span>
            <span className="ml-1 text-xs font-semibold text-teal-dark/70">
              físico
            </span>
          </div>
          <span className="font-bold text-teal/50">/</span>
          <div>
            <span className="text-2xl font-extrabold text-coral-dark">
              {kpis.totalCommittedUnits}
            </span>
            <span className="ml-1 text-xs font-semibold text-teal-dark/70">
              en fila
            </span>
          </div>
        </div>
        <p className="mt-1.5 text-xs font-medium text-teal-dark/80">
          ATP Neto Global:{' '}
          <strong className="font-extrabold text-teal-dark">
            {kpis.totalAvailableUnits}
          </strong>{' '}
          cajas/bultos
        </p>
      </AccentCard>

      <AccentCard tone="sky">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-teal-dark">
            Orden de Compra Sugerida
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky text-white shadow-sky-glow">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-teal-dark">
            $
            {kpis.estimatedReplenishmentBudgetUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-bold text-teal-dark/70">USD</span>
        </div>
        <p className="mt-1.5 text-xs font-medium text-teal-dark/80">
          Cubre quiebres + margen de seguridad (20%)
        </p>
      </AccentCard>
    </div>
  );
}
