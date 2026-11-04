import { History, Search } from 'lucide-react';
import { useState } from 'react';
import { KardexMovementItem } from '../types/warehouse';
import { AccentCard } from './ui/AccentCard';
import { SectionHeader } from './ui/SectionHeader';
import { MovementTypePill } from './ui/StatusPill';

interface KardexAuditTableProps {
  movements: KardexMovementItem[];
  loading: boolean;
}

export function KardexAuditTable({
  movements,
  loading,
}: KardexAuditTableProps) {
  const [skuFilter, setSkuFilter] = useState<string>('');

  const filtered = movements.filter((m) => {
    if (!skuFilter.trim()) return true;
    const q = skuFilter.toLowerCase();
    return (
      m.product.skuCode.toLowerCase().includes(q) ||
      m.product.name.toLowerCase().includes(q) ||
      m.referenceDoc.toLowerCase().includes(q) ||
      m.operator.toLowerCase().includes(q)
    );
  });

  return (
    <AccentCard tone="teal" className="space-y-4">
      <SectionHeader
        icon={<History className="h-5 w-5" />}
        title="Bitácora de Auditoría Kardex Inmutable"
        subtitle="Cada cambio de inventario queda sellado con fecha, documento de referencia, operario y saldo resultante."
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-teal-dark/60" />
            <input
              type="text"
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              placeholder="Filtrar por SKU, OC o responsable..."
              className="cream-input pl-9"
            />
          </div>
        }
      />

      {loading ? (
        <div className="p-8 text-center text-sm font-bold text-teal-dark/70">
          Cargando historial transaccional del Kardex...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm font-bold text-teal-dark/70">
          No hay movimientos registrados para este criterio.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-teal/20">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-teal-dark bg-teal-dark text-xs font-extrabold uppercase tracking-wider text-cream">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">SKU & Insumo</th>
                <th className="px-4 py-3">Tipo Evento</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Saldo Físico Post</th>
                <th className="px-4 py-3">Doc. Referencia</th>
                <th className="px-4 py-3">Operario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal/15 bg-surface-card">
              {filtered.map((mov) => (
                <tr key={mov.id} className="transition hover:bg-teal-bg/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-teal-dark/80">
                    {new Date(mov.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-extrabold text-teal-dark">
                      {mov.product.skuCode}
                    </span>
                    <div className="text-xs font-medium text-teal-dark/80">
                      {mov.product.name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MovementTypePill type={mov.type} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-extrabold text-teal-dark">
                    {mov.quantity}{' '}
                    <span className="text-[11px] font-medium text-teal-dark/70">
                      ({mov.product.packagingUnit})
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-extrabold text-teal-dark">
                    {mov.balanceAfter}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-teal-dark">
                    {mov.referenceDoc}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-teal-dark">
                      {mov.operator}
                    </div>
                    {mov.notes && (
                      <div className="text-[11px] text-teal-dark/70">
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
    </AccentCard>
  );
}
