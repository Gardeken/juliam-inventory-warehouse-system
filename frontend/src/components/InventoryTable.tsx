import { ArrowLeftRight, CheckCircle2, Flame, AlertTriangle } from 'lucide-react';
import { OperationalStockStatus, ProductItem } from '../types/warehouse';

interface InventoryTableProps {
  products: ProductItem[];
  loading: boolean;
  onSelectProductForMovement?: (product: ProductItem) => void;
}

function StatusBadge({ status }: { status: OperationalStockStatus }) {
  if (status === 'CRITICO_QUIEBRE_FILA') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
        <Flame className="h-3.5 w-3.5" />
        QUIEBRE EN FILA
      </span>
    );
  }

  if (status === 'URGENTE_REORDEN') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" />
        URGENTE REORDEN
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
      <CheckCircle2 className="h-3.5 w-3.5" />
      SALUDABLE
    </span>
  );
}

export function InventoryTable({
  products,
  loading,
  onSelectProductForMovement,
}: InventoryTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Cargando Matriz de Visibilidad Operativa (ATP)...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No se encontraron productos con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-100">
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
          <tbody className="divide-y divide-slate-200">
            {products.map((item) => {
              const rowBg =
                item.status === 'CRITICO_QUIEBRE_FILA'
                  ? 'bg-red-50/40 hover:bg-red-50/80'
                  : item.status === 'URGENTE_REORDEN'
                    ? 'bg-amber-50/30 hover:bg-amber-50/60'
                    : 'hover:bg-slate-50';

              return (
                <tr key={item.id} className={`transition ${rowBg}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-slate-900">
                    {item.skuCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.category}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-600">
                    {item.packagingUnit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                    {item.physicalStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-indigo-700">
                    {item.committedStock}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right text-base font-extrabold ${
                      item.availableStock < 0
                        ? 'text-red-700'
                        : item.availableStock <= item.minStock
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                    }`}
                  >
                    {item.availableStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">
                    {item.minStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {item.suggestedOrderQty > 0 ? (
                      <div>
                        <span className="font-bold text-slate-900">
                          +{item.suggestedOrderQty}
                        </span>
                        <div className="text-xs text-slate-500">
                          ${item.estimatedOrderCostUsd.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sin pedido</span>
                    )}
                  </td>
                  {onSelectProductForMovement && (
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectProductForMovement(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Despachar / Mover
                      </button>
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
