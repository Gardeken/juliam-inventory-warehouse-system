import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Download,
  Filter,
  History,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadReplenishmentCsv,
  fetchMovements,
  fetchProducts,
  fetchWarehouseKpis,
  postInventoryMovement,
} from './api/warehouse.api';
import { InventoryTable } from './components/InventoryTable';
import { KardexAuditTable } from './components/KardexAuditTable';
import { KpiCardsGrid } from './components/KpiCardsGrid';
import { QuickMovementModal } from './components/QuickMovementModal';
import { Button } from './components/ui/Button';
import {
  CreateMovementPayload,
  KardexMovementItem,
  ProductItem,
  WarehouseKpiSummary,
} from './types/warehouse';

const CATEGORIES = [
  'Todas',
  'Contenedores',
  'Vasos',
  'Cubiertos',
  'Papel',
  'Vidrio',
  'Empaques',
];

type ActiveTab = 'ATP_MATRIX' | 'KARDEX_AUDIT';

export function App() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [kpis, setKpis] = useState<WarehouseKpiSummary | null>(null);
  const [movements, setMovements] = useState<KardexMovementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('ATP_MATRIX');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyUrgentAlerts, setOnlyUrgentAlerts] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [preselectedProduct, setPreselectedProduct] =
    useState<ProductItem | null>(null);

  const loadWarehouseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, kpisData, movementsData] = await Promise.all([
        fetchProducts(),
        fetchWarehouseKpis(),
        fetchMovements({ limit: 100 }),
      ]);
      setProducts(productsData);
      setKpis(kpisData);
      setMovements(movementsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor central de almacén',
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

  const handleOpenModal = (product: ProductItem | null) => {
    setPreselectedProduct(product);
    setModalOpen(true);
  };

  const handleMovementSubmit = async (payload: CreateMovementPayload) => {
    const previousProduct = products.find((p) => p.skuCode === payload.skuCode);
    const res = await postInventoryMovement(payload);
    const prevPhysical = previousProduct?.physicalStock ?? res.updatedProduct.physicalStock;
    const prevCommitted = previousProduct?.committedStock ?? res.updatedProduct.committedStock;
    const prevAtp = previousProduct?.availableStock ?? res.updatedProduct.availableStock;

    setToastMessage(
      `Kardex actualizado (${res.updatedProduct.skuCode}): Físico ${prevPhysical} → ${res.updatedProduct.physicalStock} | Comprometido ${prevCommitted} → ${res.updatedProduct.committedStock} | Disponible (ATP) ${prevAtp} → ${res.updatedProduct.availableStock}`,
    );
    await loadWarehouseData();
    setTimeout(() => setToastMessage(null), 6500);
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Shell Superior Frosted (Evreghen Command Center Shell) */}
      <header className="frosted-shell sticky top-0 z-40 h-16 text-white shadow-subtle">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-white shadow-subtle">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  Juliam Corp LLC
                </span>
                <span className="rounded-xs bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                  Almacén Central
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Command Center de Control de Inventario & ATP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal(null)}
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Movimiento</span>
            </Button>

            <Button
              variant="ghost-shell"
              size="sm"
              onClick={() => downloadReplenishmentCsv(products)}
              disabled={products.length === 0}
              title="Descargar orden de compras urgentes en CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>

            <Button
              variant="ghost-shell"
              size="sm"
              onClick={() => void loadWarehouseData()}
              title="Sincronizar saldos en vivo"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Canvas del Workspace */}
      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        {/* Banner de error si falla backend */}
        {error && (
          <div className="rounded-md border border-status-danger/30 bg-red-50 p-4 text-xs font-semibold text-status-danger">
            Error de conexión con el backend: {error}
          </div>
        )}

        {/* Notificación Toast de Operación Exitosa */}
        {toastMessage && (
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-orange-50 p-3.5 text-xs font-medium text-primary-strong shadow-subtle">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tarjetas KPI de Telemetría */}
        <KpiCardsGrid
          kpis={kpis}
          onFilterUrgent={() => {
            setActiveTab('ATP_MATRIX');
            setOnlyUrgentAlerts(true);
          }}
        />

        {/* Barra de Navegación de Vistas */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline pb-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('ATP_MATRIX')}
              className={`inline-flex items-center gap-2 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'ATP_MATRIX'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-on-surface-muted hover:bg-surface hover:text-on-surface'
              }`}
            >
              <Boxes className="h-3.5 w-3.5" />
              Matriz de Visibilidad ATP
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('KARDEX_AUDIT')}
              className={`inline-flex items-center gap-2 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'KARDEX_AUDIT'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-on-surface-muted hover:bg-surface hover:text-on-surface'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Bitácora Kardex ({movements.length})
            </button>
          </div>
        </div>

        {/* Vista Activa */}
        {activeTab === 'ATP_MATRIX' ? (
          <div className="space-y-4">
            {/* Filtros de Búsqueda y Categoría */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline bg-surface-elevated p-3 shadow-subtle">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-on-surface-muted/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar SKU o nombre..."
                    className="telemetry-input w-full pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-xs px-2.5 py-1 text-xs font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-on-surface text-white'
                          : 'bg-surface text-on-surface-muted hover:bg-surface-soft hover:text-on-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOnlyUrgentAlerts((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  onlyUrgentAlerts
                    ? 'border-status-danger/40 bg-red-50 text-status-danger'
                    : 'border-outline bg-surface-elevated text-on-surface hover:border-outline-strong hover:bg-surface'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                {onlyUrgentAlerts
                  ? 'Mostrando Solo Urgentes (ATP ≤ Mínimo)'
                  : 'Filtrar Solo Urgentes'}
              </button>
            </div>

            {/* Tabla de Matriz ATP */}
            <InventoryTable
              products={filteredProducts}
              loading={loading}
              onSelectProductForMovement={(prod) => handleOpenModal(prod)}
            />
          </div>
        ) : (
          <KardexAuditTable movements={movements} loading={loading} />
        )}
      </main>

      {/* Modal Poka-Yoke de Movimientos */}
      <QuickMovementModal
        isOpen={modalOpen}
        products={products}
        preselectedProduct={preselectedProduct}
        onClose={() => setModalOpen(false)}
        onSubmitMovement={handleMovementSubmit}
      />
    </div>
  );
}

export default App;
