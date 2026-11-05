import { ArrowLeftRight } from 'lucide-react';
import { ProductItem } from '../types/warehouse';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';

interface InventoryTableProps {
  products: ProductItem[];
  loading: boolean;
  onSelectProductForMovement?: (product: ProductItem) => void;
}

export function InventoryTable({
  products,
  loading,
  onSelectProductForMovement,
}: InventoryTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-outline bg-surface-elevated p-12 text-center text-sm font-medium text-on-surface-muted">
        Cargando matriz de visibilidad operativa (ATP)...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-outline bg-surface-elevated p-12 text-center text-sm font-medium text-on-surface-muted">
        No se encontraron insumos con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-outline bg-surface-elevated shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-outline bg-orange-500/[0.04] text-xs font-semibold uppercase tracking-wider text-primary-strong">
            <tr>
              <th className="px-4 py-3.5">SKU</th>
              <th className="px-4 py-3.5">Insumo Gastronómico</th>
              <th className="px-4 py-3.5">Unidad Empaque</th>
              <th className="px-4 py-3.5 text-right">Físico</th>
              <th className="px-4 py-3.5 text-right">Comprometido</th>
              <th className="px-4 py-3.5 text-right">Disponible (ATP)</th>
              <th className="px-4 py-3.5 text-right">Mínimo</th>
              <th className="px-4 py-3.5">Estado Operativo</th>
              <th className="px-4 py-3.5 text-right">Sugerido Compra</th>
              {onSelectProductForMovement && (
                <th className="px-4 py-3.5 text-center">Acción</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/70">
            {products.map((item) => {
              const rowHighlight =
                item.status === 'CRITICO_QUIEBRE_FILA'
                  ? 'bg-red-500/[0.03] hover:bg-red-500/[0.06]'
                  : item.status === 'URGENTE_REORDEN'
                    ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]'
                    : 'hover:bg-surface/50';

              return (
                <tr key={item.id} className={`transition-colors ${rowHighlight}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-on-surface">
                    {item.skuCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-on-surface">
                      {item.name}
                    </div>
                    <div className="text-xs text-on-surface-muted">
                      {item.category}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-on-surface-muted">
                    {item.packagingUnit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-on-surface">
                    {item.physicalStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-on-surface-muted">
                    {item.committedStock}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-mono text-base font-bold ${
                      item.availableStock < 0
                        ? 'text-status-danger'
                        : item.availableStock <= item.minStock
                          ? 'text-amber-700'
                          : 'text-status-success'
                    }`}
                  >
                    {item.availableStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-on-surface-muted">
                    {item.minStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {item.suggestedOrderQty > 0 ? (
                      <div>
                        <span className="font-bold text-on-surface">
                          +{item.suggestedOrderQty}
                        </span>
                        <div className="text-[11px] text-on-surface-muted">
                          ${item.estimatedOrderCostUsd.toFixed(2)} USD
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-muted/60">—</span>
                    )}
                  </td>
                  {onSelectProductForMovement && (
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <Button
                        variant={item.status === 'CRITICO_QUIEBRE_FILA' ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => onSelectProductForMovement(item)}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Despachar
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
