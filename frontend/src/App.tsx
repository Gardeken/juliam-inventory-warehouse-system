import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Filter,
  RefreshCw,
  Search,
  Warehouse,
} from 'lucide-react';
import {
  downloadReplenishmentCsv,
  fetchProducts,
  fetchWarehouseKpis,
} from './api/warehouse.api';
import { InventoryTable } from './components/InventoryTable';
import { KpiCardsGrid } from './components/KpiCardsGrid';
import { ProductItem, WarehouseKpiSummary } from './types/warehouse';

const CATEGORIES = [
  'Todas',
  'Contenedores',
  'Vasos',
  'Cubiertos',
  'Papel',
  'Vidrio',
  'Empaques',
];

export function App() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [kpis, setKpis] = useState<WarehouseKpiSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyUrgentAlerts, setOnlyUrgentAlerts] = useState<boolean>(false);

  const loadWarehouseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, kpisData] = await Promise.all([
        fetchProducts(),
        fetchWarehouseKpis(),
      ]);
      setProducts(productsData);
      setKpis(kpisData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor de almacén',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWarehouseData();
  }, [loadWarehouseData]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (selectedCategory !== 'Todas' && item.category !== selectedCategory) {
        return false;
      }
      if (onlyUrgentAlerts && !item.needsReplenishment) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          item.skuCode.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, onlyUrgentAlerts, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 text-white shadow">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Juliam Corp LLC — Control Centralizado de Almacén
              </h1>
              <p className="text-xs text-slate-400">
                Matriz de Visibilidad ATP (Stock Físico vs. Comprometido en Fila) y Kardex ACID
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => downloadReplenishmentCsv(products)}
              disabled={products.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Exportar Orden Reabastecimiento CSV
            </button>

            <button
              type="button"
              onClick={() => void loadWarehouseData()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              title="Actualizar saldos"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <strong>Error de conexión operativa:</strong> {error}
          </div>
        )}

        <KpiCardsGrid
          kpis={kpis}
          onFilterUrgent={() => setOnlyUrgentAlerts(true)}
        />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por SKU (ej. SKU-002) o insumo..."
                  className="w-64 rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === category
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOnlyUrgentAlerts((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-bold transition ${
                onlyUrgentAlerts
                  ? 'border-amber-400 bg-amber-100 text-amber-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {onlyUrgentAlerts
                ? 'Mostrando Solo Compras Urgentes (ATP ≤ Mínimo)'
                : 'Filtrar Compras Urgentes'}
            </button>
          </div>

          <InventoryTable products={filteredProducts} loading={loading} />
        </section>
      </main>
    </div>
  );
}
export default App;
