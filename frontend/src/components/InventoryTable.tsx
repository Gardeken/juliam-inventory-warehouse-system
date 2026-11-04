import { ArrowLeftRight } from 'lucide-react';
import { ProductItem } from '../types/warehouse';
import { PillButton } from './ui/PillButton';
import { StockStatusPill } from './ui/StatusPill';

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
      <div className="rounded-3xl border-2 border-teal/20 bg-surface-card p-8 text-center text-sm font-bold text-teal-dark/70 shadow-card">
        Cargando Matriz de Visibilidad Operativa (ATP)...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-teal/20 bg-surface-card p-8 text-center text-sm font-bold text-teal-dark/70 shadow-card">
        No se encontraron productos con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-teal/25 bg-surface-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-teal-dark bg-teal-dark text-xs font-extrabold uppercase tracking-wider text-cream">
            <tr>
              <th className="px-4 py-3.5">SKU</th>
              <th className="px-4 py-3.5">Insumo Gastronómico</th>
              <th className="px-4 py-3.5">Empaque</th>
              <th className="px-4 py-3.5 text-right">Stock Físico</th>
              <th className="px-4 py-3.5 text-right">Comprometido (Fila)</th>
              <th className="px-4 py-3.5 text-right">Disponible Real (ATP)</th>
              <th className="px-4 py-3.5 text-right">Stock Mínimo</th>
              <th className="px-4 py-3.5">Estado Operativo</th>
              <th className="px-4 py-3.5 text-right">Sugerido Pedir</th>
              {onSelectProductForMovement && (
                <th className="px-4 py-3.5 text-center">Acción Piso</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/15">
            {products.map((item) => {
              const rowAccent =
                item.status === 'CRITICO_QUIEBRE_FILA'
                  ? 'border-l-[6px] border-l-coral bg-coral-light/10 hover:bg-coral-light/20'
                  : item.status === 'URGENTE_REORDEN'
                    ? 'border-l-[6px] border-l-gold bg-cream/60 hover:bg-cream'
                    : 'border-l-[6px] border-l-teal-light hover:bg-teal-bg/50';

              return (
                <tr key={item.id} className={`transition ${rowAccent}`}>
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-extrabold text-teal-dark">
                    {item.skuCode}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-extrabold text-teal-dark">
                      {item.name}
                    </div>
                    <div className="text-xs font-semibold text-teal-dark/70">
                      {item.category}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-teal-dark/80">
                    {item.packagingUnit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-base font-extrabold text-teal-dark">
                    {item.physicalStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-extrabold text-coral-dark">
                    {item.committedStock}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3.5 text-right text-lg font-extrabold ${
                      item.availableStock < 0
                        ? 'text-coral-dark'
                        : item.availableStock <= item.minStock
                          ? 'text-gold-dark'
                          : 'text-status-success'
                    }`}
                  >
                    {item.availableStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-teal-dark/70">
                    {item.minStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StockStatusPill status={item.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    {item.suggestedOrderQty > 0 ? (
                      <div>
                        <span className="text-sm font-extrabold text-teal-dark">
                          +{item.suggestedOrderQty}
                        </span>
                        <div className="text-xs font-bold text-teal-dark/70">
                          ${item.estimatedOrderCostUsd.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-teal-dark/45">
                        Cubierto
                      </span>
                    )}
                  </td>
                  {onSelectProductForMovement && (
                    <td className="whitespace-nowrap px-4 py-3.5 text-center">
                      <PillButton
                        variant={
                          item.status === 'CRITICO_QUIEBRE_FILA'
                            ? 'coral'
                            : 'teal'
                        }
                        size="sm"
                        onClick={() => onSelectProductForMovement(item)}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Mover (3 Clics)
                      </PillButton>
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
