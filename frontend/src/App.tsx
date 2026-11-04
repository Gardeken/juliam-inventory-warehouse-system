import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Download,
  Filter,
  History,
  PlusCircle,
  RefreshCw,
  Search,
  Warehouse,
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
import { AccentCard } from './components/ui/AccentCard';
import { PillButton } from './components/ui/PillButton';
import { SectionHeader } from './components/ui/SectionHeader';
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
        fetchMovements({ limit: 80 }),
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

  const handleOpenModalForProduct = (product: ProductItem | null) => {
    setPreselectedProduct(product);
    setModalOpen(true);
  };

  const handleMovementSubmit = async (payload: CreateMovementPayload) => {
    const res = await postInventoryMovement(payload);
    setToastMessage(
      `Transacción ACID registrada: ${payload.type} (${payload.quantity}) en ${res.updatedProduct.skuCode}. Nuevo Stock Físico: ${res.updatedProduct.physicalStock} | ATP: ${res.updatedProduct.availableStock}`,
    );
    await loadWarehouseData();
    setTimeout(() => setToastMessage(null), 6000);
  };

  return (
    <div className="min-h-screen bg-surface-base pb-12">
      {/* Header con identidad Flip7 Teal-Gold-Cream */}
      <header className="border-b-4 border-teal-dark bg-gradient-to-r from-teal-dark via-teal to-teal-dark text-white shadow-teal-glow">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 -rotate-3 items-center justify-center rounded-2xl border-3 border-teal-dark bg-cream text-teal-dark shadow-accent-glow">
              <Warehouse className="h-8 w-8" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="retro-ribbon">
                  🛡️ JULIAM CORP LLC • ALMACÉN CENTRAL
                </span>
              </div>
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-cream sm:text-2xl">
                Control de Inventario ATP & Kardex Transaccional
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <PillButton
              variant="gold"
              size="md"
              onClick={() => handleOpenModalForProduct(null)}
            >
              <PlusCircle className="h-4 w-4" />
              + Registrar Movimiento (3 Clics)
            </PillButton>

            <PillButton
              variant="cream"
              size="sm"
              onClick={() => downloadReplenishmentCsv(products)}
              disabled={products.length === 0}
            >
              <Download className="h-4 w-4 text-teal-dark" />
              Orden Compra CSV
            </PillButton>

            <PillButton
              variant="teal"
              size="sm"
              onClick={() => void loadWarehouseData()}
              title="Sincronizar con PostgreSQL"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              Sincronizar
            </PillButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
        {error && (
          <AccentCard tone="coral">
            <p className="text-sm font-extrabold text-coral-dark">
              ⚠️ Error de conexión con el Backend: {error}
            </p>
          </AccentCard>
        )}

        {toastMessage && (
          <AccentCard tone="gold">
            <p className="text-sm font-extrabold text-teal-dark">
              ✅ {toastMessage}
            </p>
          </AccentCard>
        )}

        {/* KPIs Ejecutivos */}
        <KpiCardsGrid
          kpis={kpis}
          onFilterUrgent={() => {
            setActiveTab('ATP_MATRIX');
            setOnlyUrgentAlerts(true);
          }}
        />

        {/* Selector de Pestañas (Matriz ATP vs Bitácora Kardex) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <PillButton
              variant={activeTab === 'ATP_MATRIX' ? 'teal' : 'cream'}
              onClick={() => setActiveTab('ATP_MATRIX')}
            >
              <Boxes className="h-4 w-4" />
              1. Matriz de Visibilidad Operativa (ATP)
            </PillButton>

            <PillButton
              variant={activeTab === 'KARDEX_AUDIT' ? 'teal' : 'cream'}
              onClick={() => setActiveTab('KARDEX_AUDIT')}
            >
              <History className="h-4 w-4" />
              2. Bitácora Kardex Inmutable ({movements.length})
            </PillButton>
          </div>
        </div>

        {activeTab === 'ATP_MATRIX' ? (
          <AccentCard tone="teal" className="space-y-5">
            <SectionHeader
              icon={<Boxes className="h-5 w-5" />}
              title="Matriz de Visibilidad Operativa (La Ecuación de Rescate)"
              subtitle="Stock Disponible Real (ATP) = Stock Físico en Estante − Stock Comprometido en Fila de Despacho"
              action={
                <PillButton
                  variant={onlyUrgentAlerts ? 'coral' : 'cream'}
                  size="sm"
                  onClick={() => setOnlyUrgentAlerts((prev) => !prev)}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {onlyUrgentAlerts
                    ? 'Viendo Solo Compras Urgentes (ATP ≤ Mínimo)'
                    : 'Filtrar Solo Compras Urgentes'}
                </PillButton>
              }
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-teal-dark/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por SKU (SKU-002) o insumo..."
                  className="cream-input w-full pl-10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORIES.map((category) => (
                  <PillButton
                    key={category}
                    variant={
                      selectedCategory === category ? 'gold' : 'cream'
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </PillButton>
                ))}
              </div>
            </div>

            <InventoryTable
              products={filteredProducts}
              loading={loading}
              onSelectProductForMovement={(prod) =>
                handleOpenModalForProduct(prod)
              }
            />
          </AccentCard>
        ) : (
          <KardexAuditTable movements={movements} loading={loading} />
        )}
      </main>

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
