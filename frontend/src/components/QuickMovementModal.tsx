import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { CreateMovementPayload, ProductItem } from '../types/warehouse';
import { Button } from './ui/Button';

interface QuickMovementModalProps {
  isOpen: boolean;
  products: ProductItem[];
  preselectedProduct: ProductItem | null;
  onClose: () => void;
  onSubmitMovement: (payload: CreateMovementPayload) => Promise<void>;
}

type ActionMovementType = 'OUT' | 'IN' | 'SHRINKAGE' | 'COMMIT_ORDER';

const MOVEMENT_TYPES: {
  type: ActionMovementType;
  title: string;
  subtitle: string;
  icon: typeof ArrowUpRight;
}[] = [
  {
    type: 'OUT',
    title: 'Salida Despacho',
    subtitle: 'Entrega física a distribuidor',
    icon: ArrowUpRight,
  },
  {
    type: 'IN',
    title: 'Entrada Proveedor',
    subtitle: 'Recepción de cajas de fábrica',
    icon: ArrowDownLeft,
  },
  {
    type: 'SHRINKAGE',
    title: 'Ajuste Merma',
    subtitle: 'Baja por rotura o daño en pasillo',
    icon: ShieldAlert,
  },
  {
    type: 'COMMIT_ORDER',
    title: 'Reserva en Fila',
    subtitle: 'Comprometer stock para camión en puerta',
    icon: Clock,
  },
];

export function QuickMovementModal({
  isOpen,
  products,
  preselectedProduct,
  onClose,
  onSubmitMovement,
}: QuickMovementModalProps) {
  const [movementType, setMovementType] = useState<ActionMovementType>('OUT');
  const [skuCode, setSkuCode] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [referenceDoc, setReferenceDoc] = useState<string>('OC-FILA-DESPACHO');
  const [operator, setOperator] = useState<string>('Operario_Piso_Turno1');
  const [notes, setNotes] = useState<string>('');
  const [fulfillsCommittedOrder, setFulfillsCommittedOrder] =
    useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const defaultSku =
      preselectedProduct?.skuCode ?? products[0]?.skuCode ?? '';
    setSkuCode(defaultSku);
    setQuantity(1);
    setMovementType('OUT');
    setFulfillsCommittedOrder(false);
    setReferenceDoc('OC-FILA-DESPACHO');
    setSubmitError(null);
  }, [isOpen, preselectedProduct, products]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.skuCode === skuCode) ?? null,
    [products, skuCode],
  );

  const previewMetrics = useMemo(() => {
    if (!selectedProduct) return null;

    let nextPhysical = selectedProduct.physicalStock;
    let nextCommitted = selectedProduct.committedStock;

    if (movementType === 'IN') {
      nextPhysical += quantity;
    } else if (movementType === 'OUT') {
      nextPhysical -= quantity;
      if (fulfillsCommittedOrder && selectedProduct.committedStock > 0) {
        nextCommitted = Math.max(0, selectedProduct.committedStock - quantity);
      }
    } else if (movementType === 'SHRINKAGE') {
      nextPhysical -= quantity;
    } else if (movementType === 'COMMIT_ORDER') {
      nextCommitted += quantity;
    }

    const nextAvailable = nextPhysical - nextCommitted;
    const safetyBuffer = Math.ceil(selectedProduct.minStock * 0.2);
    const targetLevel = selectedProduct.minStock + safetyBuffer;
    const nextSuggestedOrder =
      nextAvailable <= selectedProduct.minStock
        ? Math.max(0, targetLevel - nextAvailable)
        : 0;

    return {
      nextPhysical,
      nextCommitted,
      nextAvailable,
      nextSuggestedOrder,
      physicalDelta: nextPhysical - selectedProduct.physicalStock,
      committedDelta: nextCommitted - selectedProduct.committedStock,
      availableDelta: nextAvailable - selectedProduct.availableStock,
    };
  }, [selectedProduct, movementType, quantity, fulfillsCommittedOrder]);

  if (!isOpen) return null;

  const isPhysicalDeduction =
    movementType === 'OUT' || movementType === 'SHRINKAGE';
  const exceedsPhysicalStock =
    selectedProduct !== null &&
    isPhysicalDeduction &&
    quantity > selectedProduct.physicalStock;

  const adjustQty = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleTypeSelect = (nextType: ActionMovementType) => {
    setMovementType(nextType);
    if (nextType === 'IN') {
      setReferenceDoc('FAC-PROV-901');
    } else if (nextType === 'SHRINKAGE') {
      setReferenceDoc('ACTA-MERMA');
    } else {
      setReferenceDoc('OC-FILA-DESPACHO');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || exceedsPhysicalStock || quantity < 1) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitMovement({
        skuCode: selectedProduct.skuCode,
        type: movementType,
        quantity,
        referenceDoc: referenceDoc.trim() || 'MOV-PISO',
        operator: operator.trim() || 'Operario_Piso',
        notes: notes.trim() || undefined,
        fulfillsCommittedOrder:
          movementType === 'OUT' ? fulfillsCommittedOrder : false,
      });
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Error al registrar transacción en el Kardex',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-outline bg-surface-elevated p-6 shadow-dialog">
        <div className="flex items-start justify-between gap-4 border-b border-outline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-lg font-bold text-on-surface">
                Registrar Movimiento de Kardex (Poka-Yoke)
              </h2>
            </div>
            <p className="mt-1 text-xs text-on-surface-muted">
              Transacción ACID con validación en caliente de stock físico e invariantes de almacén.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-on-surface-muted hover:bg-surface hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-5">
          {/* Paso 1: Tipo de Evento */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
              1. Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {MOVEMENT_TYPES.map((opt) => {
                const Icon = opt.icon;
                const active = movementType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleTypeSelect(opt.type)}
                    className={`flex flex-col items-start rounded-md border p-3 text-left transition-all ${
                      active
                        ? 'border-primary bg-orange-50/40 text-primary-strong ring-1 ring-primary'
                        : 'border-outline bg-surface-elevated text-on-surface hover:border-outline-strong hover:bg-surface/50'
                    }`}
                  >
                    <Icon className={`mb-2 h-4 w-4 ${active ? 'text-primary' : 'text-on-surface-muted'}`} />
                    <span className="text-xs font-bold leading-tight">
                      {opt.title}
                    </span>
                    <span className="mt-0.5 text-[11px] text-on-surface-muted leading-tight">
                      {opt.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 2: Selección de Producto & Cantidad */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
                2. Insumo del Catálogo Maestro
              </label>
              <select
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="h-10 w-full rounded-sm border border-outline bg-surface-elevated px-3 text-sm font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.skuCode}>
                    {p.skuCode} — {p.name} ({p.packagingUnit})
                  </option>
                ))}
              </select>

              {selectedProduct && previewMetrics && (
                <div className="mt-3 rounded-md border border-primary/30 bg-orange-50/30 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-outline/70 pb-1.5">
                    <span className="font-bold uppercase tracking-wider text-primary-strong">
                      Vista Previa del Impacto (Antes → Después)
                    </span>
                    <span className="text-[11px] font-medium text-on-surface-muted">
                      {selectedProduct.packagingUnit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-muted">Stock Físico en Piso:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-on-surface-muted line-through">
                        {selectedProduct.physicalStock}
                      </span>
                      <span className="text-on-surface-muted">→</span>
                      <strong
                        className={`text-sm ${
                          previewMetrics.nextPhysical < 0
                            ? 'text-status-danger'
                            : 'text-on-surface'
                        }`}
                      >
                        {previewMetrics.nextPhysical}
                      </strong>
                      {previewMetrics.physicalDelta !== 0 && (
                        <span
                          className={`rounded-xs px-1.5 py-0.5 text-[11px] font-bold ${
                            previewMetrics.physicalDelta > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-orange-100 text-primary-strong'
                          }`}
                        >
                          {previewMetrics.physicalDelta > 0
                            ? `+${previewMetrics.physicalDelta}`
                            : previewMetrics.physicalDelta}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-muted">Comprometido en Fila:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span
                        className={
                          previewMetrics.committedDelta !== 0
                            ? 'text-on-surface-muted line-through'
                            : 'text-on-surface-muted'
                        }
                      >
                        {selectedProduct.committedStock}
                      </span>
                      {previewMetrics.committedDelta !== 0 && (
                        <>
                          <span className="text-on-surface-muted">→</span>
                          <strong className="text-sm text-on-surface">
                            {previewMetrics.nextCommitted}
                          </strong>
                          <span className="rounded-xs bg-blue-100 px-1.5 py-0.5 text-[11px] font-bold text-status-info">
                            {previewMetrics.committedDelta > 0
                              ? `+${previewMetrics.committedDelta}`
                              : previewMetrics.committedDelta}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-outline/70 pt-1.5">
                    <span className="font-semibold text-on-surface">
                      Disponible Real (ATP):
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span
                        className={
                          previewMetrics.availableDelta !== 0
                            ? 'text-on-surface-muted line-through'
                            : 'text-on-surface-muted'
                        }
                      >
                        {selectedProduct.availableStock}
                      </span>
                      <span className="text-on-surface-muted">→</span>
                      <strong
                        className={`text-sm ${
                          previewMetrics.nextAvailable < 0
                            ? 'text-status-danger'
                            : previewMetrics.nextAvailable <=
                                selectedProduct.minStock
                              ? 'text-amber-700'
                              : 'text-status-success'
                        }`}
                      >
                        {previewMetrics.nextAvailable}
                      </strong>
                      <span
                        className={`rounded-xs px-1.5 py-0.5 text-[11px] font-bold ${
                          previewMetrics.availableDelta > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : previewMetrics.availableDelta < 0
                              ? 'bg-red-100 text-status-danger'
                              : 'bg-surface text-on-surface-muted'
                        }`}
                      >
                        {previewMetrics.availableDelta > 0
                          ? `+${previewMetrics.availableDelta}`
                          : previewMetrics.availableDelta === 0
                            ? 'Sin cambio ATP'
                            : previewMetrics.availableDelta}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-outline/50 pt-1.5 text-[11px]">
                    <span className="text-on-surface-muted">
                      Sugerido Compra Post-Movimiento:
                    </span>
                    <strong className="font-mono text-on-surface">
                      {selectedProduct.suggestedOrderQty > 0
                        ? `+${selectedProduct.suggestedOrderQty}`
                        : '0'}{' '}
                      →{' '}
                      <span className="text-primary-strong">
                        {previewMetrics.nextSuggestedOrder > 0
                          ? `+${previewMetrics.nextSuggestedOrder}`
                          : '0 (Saludable)'}
                      </span>
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
                Cantidad ({selectedProduct?.packagingUnit ?? 'Unidades'})
              </label>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => adjustQty(-5)}
                  disabled={quantity <= 5}
                >
                  -5
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => adjustQty(-1)}
                  disabled={quantity <= 1}
                >
                  -1
                </Button>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value, 10);
                    setQuantity(Number.isFinite(val) && val > 0 ? val : 1);
                  }}
                  className="h-10 w-24 text-center rounded-sm border border-outline bg-surface-elevated font-mono text-base font-bold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => adjustQty(1)}
                >
                  +1
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => adjustQty(5)}
                >
                  +5
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => adjustQty(10)}
                >
                  +10
                </Button>
              </div>

              {movementType === 'OUT' &&
                selectedProduct &&
                selectedProduct.committedStock > 0 && (
                  <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-md border border-outline bg-surface/50 p-2.5 text-xs text-on-surface">
                    <input
                      type="checkbox"
                      checked={fulfillsCommittedOrder}
                      onChange={(e) =>
                        setFulfillsCommittedOrder(e.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded-xs border-outline text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="font-semibold">
                        Entregar orden ya reservada en fila
                      </div>
                      <p className="mt-0.5 text-[11px] text-on-surface-muted leading-snug">
                        {fulfillsCommittedOrder
                          ? 'Activado: resta de Físico y de Comprometido a la vez (el Disponible ATP se mantiene igual).'
                          : 'Desactivado: salida directa de piso (resta solo de Físico y reduce el Disponible ATP).'}
                      </p>
                    </div>
                  </label>
                )}

              {exceedsPhysicalStock && selectedProduct && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-status-danger/30 bg-red-50 p-2.5 text-xs font-medium text-status-danger">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Bloqueo Poka-Yoke: Intentas retirar {quantity}, pero solo hay{' '}
                    <strong>{selectedProduct.physicalStock}</strong> disponibles en piso.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Documento y Responsable */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
                Documento Referencia
              </label>
              <input
                type="text"
                required
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder="Ej. OC-FILA-201"
                className="telemetry-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
                Operario Responsable
              </label>
              <input
                type="text"
                required
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Ej. Carlos_Turno1"
                className="telemetry-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
                Nota de Auditoría
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Carril rápido / observación..."
                className="telemetry-input w-full"
              />
            </div>
          </div>

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-red-50 p-3 text-xs font-medium text-status-danger">
              {submitError}
            </div>
          )}

          {/* Paso 3: Confirmación */}
          <div className="flex items-center justify-end gap-2.5 border-t border-outline pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting || exceedsPhysicalStock || !selectedProduct}
            >
              <Check className="h-4 w-4" />
              {submitting
                ? 'Procesando transacción ACID...'
                : 'Confirmar y Sellar en Kardex'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
