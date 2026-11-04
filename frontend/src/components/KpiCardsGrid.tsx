import {
  AlertOctagon,
  AlertTriangle,
  Boxes,
  DollarSign,
} from 'lucide-react';
import { WarehouseKpiSummary } from '../types/warehouse';

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
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        onClick={onFilterUrgent}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onFilterUrgent()}
        className="cursor-pointer rounded-xl border border-red-200 bg-red-50/70 p-5 shadow-sm transition hover:border-red-300 hover:bg-red-50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">
            Quiebre en Fila (ATP &lt; 0)
          </span>
          <AlertOctagon className="h-5 w-5 text-red-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-red-700">
            {kpis.criticalStockoutCount}
          </span>
          <span className="text-xs font-medium text-red-600">
            SKUs sin cobertura para la fila
          </span>
        </div>
        <p className="mt-1 text-xs text-red-700/80">
          Requiere atención en Ventanilla de Incidencias
        </p>
      </div>

      <div
        onClick={onFilterUrgent}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onFilterUrgent()}
        className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Alerta Punto de Reorden
          </span>
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-800">
            {kpis.urgentReorderCount}
          </span>
          <span className="text-xs font-medium text-amber-700">
            SKUs con ATP &le; Mínimo
          </span>
        </div>
        <p className="mt-1 text-xs text-amber-800/80">
           {kpis.healthyCount} de {kpis.totalSkus} SKUs en estado saludable
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Stock Físico vs. Comprometido
          </span>
          <Boxes className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <div>
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.totalPhysicalUnits}
            </span>
            <span className="ml-1 text-xs text-slate-500">en piso</span>
          </div>
          <span className="text-slate-300">/</span>
          <div>
            <span className="text-2xl font-bold text-indigo-600">
              {kpis.totalCommittedUnits}
            </span>
            <span className="ml-1 text-xs text-slate-500">en fila</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          ATP Neto Global: <strong className="text-slate-700">{kpis.totalAvailableUnits}</strong> cajas/bultos
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Orden de Compra Sugerida
          </span>
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            ${kpis.estimatedReplenishmentBudgetUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-medium text-slate-500">USD</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Cubre quiebres + margen de seguridad (20%)
        </p>
      </div>
    </div>
  );
}
