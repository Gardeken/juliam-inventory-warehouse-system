import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { MovementType, OperationalStockStatus } from '../../types/warehouse';

export function StatusBadge({ status }: { status: OperationalStockStatus }) {
  if (status === 'CRITICO_QUIEBRE_FILA') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-status-danger/40 bg-red-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-status-danger">
        <AlertCircle className="h-3.5 w-3.5" />
        Quiebre en Fila
      </span>
    );
  }

  if (status === 'URGENTE_REORDEN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" />
        Punto de Reorden
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-emerald-300/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-status-production-fg">
      <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
      Saludable
    </span>
  );
}

const MOVEMENT_META: Record<
  MovementType,
  { label: string; badgeClasses: string; icon: typeof ArrowUpRight }
> = {
  INITIAL_CUT: {
    label: 'Corte Inicial',
    badgeClasses: 'bg-surface text-on-surface-muted border-outline',
    icon: Layers,
  },
  IN: {
    label: 'Entrada Proveedor',
    badgeClasses: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: ArrowDownLeft,
  },
  OUT: {
    label: 'Salida Despacho',
    badgeClasses: 'bg-orange-50 text-primary-strong border-orange-200',
    icon: ArrowUpRight,
  },
  SHRINKAGE: {
    label: 'Ajuste Merma',
    badgeClasses: 'bg-red-50 text-status-danger border-red-200',
    icon: ShieldAlert,
  },
  COMMIT_ORDER: {
    label: 'Reserva Fila',
    badgeClasses: 'bg-blue-50 text-status-info border-blue-200',
    icon: Clock,
  },
  RELEASE_ORDER: {
    label: 'Liberación Fila',
    badgeClasses: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Clock,
  },
};

export function MovementTypeBadge({ type }: { type: MovementType }) {
  const meta = MOVEMENT_META[type];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${meta.badgeClasses}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

