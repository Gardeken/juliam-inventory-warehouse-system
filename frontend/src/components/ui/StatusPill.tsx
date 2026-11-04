import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { MovementType, OperationalStockStatus } from '../../types/warehouse';

export function StockStatusPill({
  status,
}: {
  status: OperationalStockStatus;
}) {
  if (status === 'CRITICO_QUIEBRE_FILA') {
    return (
      <span className="inline-flex animate-boom-pulse items-center gap-1.5 rounded-full border-2 border-coral-dark bg-coral px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-coral-glow">
        <Flame className="h-3.5 w-3.5" />
        BOOM: Quiebre Fila
      </span>
    );
  }

  if (status === 'URGENTE_REORDEN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-teal-dark/70 bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-teal-dark shadow-accent-glow">
        <AlertTriangle className="h-3.5 w-3.5" />
        Urgente Reorden
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-teal-dark/40 bg-teal-bg px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-teal-dark">
      <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
      Saludable
    </span>
  );
}

const MOVEMENT_BADGE_MAP: Record<
  MovementType,
  { label: string; classes: string; icon: typeof ArrowUpRight }
> = {
  INITIAL_CUT: {
    label: 'CORTE INICIAL',
    classes: 'bg-cream border-teal-dark/40 text-teal-dark',
    icon: ClipboardCheck,
  },
  IN: {
    label: 'ENTRADA PROVEEDOR',
    classes: 'bg-teal text-white border-teal-dark shadow-teal-glow',
    icon: ArrowDownLeft,
  },
  OUT: {
    label: 'SALIDA DESPACHO',
    classes: 'bg-coral text-white border-coral-dark shadow-coral-glow',
    icon: ArrowUpRight,
  },
  SHRINKAGE: {
    label: 'AJUSTE MERMA',
    classes: 'bg-gold text-teal-dark border-teal-dark/70 shadow-accent-glow',
    icon: ShieldAlert,
  },
  COMMIT_ORDER: {
    label: 'ORDEN EN FILA',
    classes: 'bg-sky text-white border-teal-dark/40 shadow-sky-glow',
    icon: ClipboardCheck,
  },
  RELEASE_ORDER: {
    label: 'LIBERACIÓN FILA',
    classes: 'bg-cream-dark text-teal-dark border-teal-dark/40',
    icon: ClipboardCheck,
  },
};

export function MovementTypePill({ type }: { type: MovementType }) {
  const cfg = MOVEMENT_BADGE_MAP[type];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-extrabold tracking-wide ${cfg.classes}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}
