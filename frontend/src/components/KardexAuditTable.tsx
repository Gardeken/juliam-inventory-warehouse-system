import { History, Search } from 'lucide-react';
import { useState } from 'react';
import { KardexMovementItem } from '../types/warehouse';
import { MovementTypeBadge } from './ui/StatusBadge';

interface KardexAuditTableProps {
  movements: KardexMovementItem[];
  loading: boolean;
}

export function KardexAuditTable({
  movements,
  loading,
}: KardexAuditTableProps) {
  const [filter, setFilter] = useState<string>('');

  const filtered = movements.filter((m) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      m.product.skuCode.toLowerCase().includes(q) ||
      m.product.name.toLowerCase().includes(q) ||
      m.referenceDoc.toLowerCase().includes(q) ||
      m.operator.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-lg border border-outline bg-surface-elevated shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-orange-500/10 text-primary">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
              Bitácora de Auditoría Kardex Inmutable
            </h2>
            <p className="text-xs text-on-surface-muted">
              Registro secuencial de eventos con sello de tiempo, documento de respaldo y saldo resultante.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-on-surface-muted/60" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por SKU, OC o responsable..."
            className="telemetry-input w-full pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm font-medium text-on-surface-muted">
          Cargando eventos transaccionales del Kardex...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm font-medium text-on-surface-muted">
          No se encontraron eventos para el filtro aplicado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-outline bg-surface text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">SKU & Insumo</th>
                <th className="px-4 py-3">Tipo Movimiento</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Saldo Físico Post</th>
                <th className="px-4 py-3">Doc. Referencia</th>
                <th className="px-4 py-3">Operario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/70">
              {filtered.map((mov) => (
                <tr key={mov.id} className="hover:bg-surface/50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-on-surface-muted">
                    {new Date(mov.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-on-surface">
                      {mov.product.skuCode}
                    </span>
                    <div className="text-xs text-on-surface-muted">
                      {mov.product.name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MovementTypeBadge type={mov.type} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold text-on-surface">
                    {mov.quantity}{' '}
                    <span className="text-[11px] font-normal text-on-surface-muted">
                      ({mov.product.packagingUnit})
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-bold text-on-surface">
                    {mov.balanceAfter}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-on-surface">
                    {mov.referenceDoc}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-on-surface">
                      {mov.operator}
                    </div>
                    {mov.notes && (
                      <div className="text-[11px] text-on-surface-muted">
                        {mov.notes}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
