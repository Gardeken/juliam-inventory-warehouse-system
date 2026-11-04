import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  ShieldAlert,
  X,
} from 'lucide-react';
import { CreateMovementPayload, ProductItem } from '../types/warehouse';
import { AccentCard } from './ui/AccentCard';
import { CounterButton } from './ui/CounterButton';
import { PillButton } from './ui/PillButton';

interface QuickMovementModalProps {
  isOpen: boolean;
  products: ProductItem[];
  preselectedProduct: ProductItem | null;
  onClose: () => void;
  onSubmitMovement: (payload: CreateMovementPayload) => Promise<void>;
}

type ActionMovementType = 'OUT' | 'IN' | 'SHRINKAGE' | 'COMMIT_ORDER';

const MOVEMENT_OPTIONS: {
  type: ActionMovementType;
  title: string;
  subtitle: string;
  activeClasses: string;
  icon: typeof ArrowUpRight;
}[] = [
  {
    type: 'OUT',
    title: '1. Salida Despacho',
    subtitle: 'Despachar cajas a cliente',
    activeClasses:
      'border-coral-dark bg-coral text-white shadow-coral-glow scale-[1.02]',
    icon: ArrowUpRight,
  },
  {
    type: 'IN',
    title: '2. Entrada Proveedor',
    subtitle: 'Ingreso de mercancía',
    activeClasses:
      'border-teal-dark bg-teal text-white shadow-teal-glow scale-[1.02]',
    icon: ArrowDownLeft,
  },
  {
    type: 'SHRINKAGE',
    title: '3. Ajuste Merma',
    subtitle: 'Rotura o daño en piso',
    activeClasses:
      'border-teal-dark bg-gold text-teal-dark shadow-accent-glow scale-[1.02]',
    icon: ShieldAlert,
  },
  {
    type: 'COMMIT_ORDER',
    title: '4. Orden en Fila',
    subtitle: 'Reservar stock vendido',
    activeClasses:
      'border-teal-dark bg-sky text-white shadow-sky-glow scale-[1.02]',
    icon: ClipboardList,
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
    useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const defaultSku =
      preselectedProduct?.skuCode ?? products[0]?.skuCode ?? '';
    setSkuCode(defaultSku);
    setQuantity(1);
    setMovementType('OUT');
    setReferenceDoc('OC-FILA-DESPACHO');
    setSubmitError(null);
  }, [isOpen, preselectedProduct, products]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.skuCode === skuCode) ?? null,
    [products, skuCode],
  );

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

  const handleMovementTypeChange = (nextType: ActionMovementType) => {
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
          : 'Error al registrar movimiento transaccional',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-dark/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border-4 border-teal-dark bg-surface-card p-6 shadow-teal-glow">
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-dashed border-teal/35 pb-4">
          <div>
            <span className="retro-ribbon mb-2">
              ⚡ Operación Poka-Yoke en 3 Clics
            </span>
            <h2 className="text-xl font-extrabold uppercase tracking-wider text-teal-dark">
              Registro Transaccional de Kardex (ACID)
            </h2>
            <p className="text-xs font-medium text-teal-dark/75">
              Cero edición libre: valida stock físico en vivo y audita cada caja.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-teal-dark bg-cream text-teal-dark transition hover:bg-coral hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-5">
          {/* CLIC 1: Tipo de Movimiento */}
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-teal-dark">
              Clic 1 — Selecciona el Tipo de Evento
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {MOVEMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = movementType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleMovementTypeChange(opt.type)}
                    className={`flex flex-col items-start rounded-2xl border-2 p-3 text-left transition-all duration-150 ${
                      active
                        ? opt.activeClasses
                        : 'border-teal/30 bg-cream text-teal-dark hover:border-teal'
                    }`}
                  >
                    <Icon className="mb-1.5 h-5 w-5" />
                    <span className="text-xs font-extrabold uppercase">
                      {opt.title}
                    </span>
                    <span className="text-[11px] opacity-85">
                      {opt.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CLIC 2: Producto Oficial y Cantidad con CounterButtons */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-teal-dark">
                Clic 2 — Producto del Catálogo Oficial
              </label>
              <select
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="cream-input w-full"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.skuCode}>
                    {p.skuCode} — {p.name} ({p.packagingUnit})
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <AccentCard
                  tone={
                    selectedProduct.availableStock < 0
                      ? 'coral'
                      : selectedProduct.needsReplenishment
                        ? 'gold'
                        : 'teal'
                  }
                  className="mt-3 !p-3.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-dark">
                      Stock Físico en Estante:
                    </span>
                    <span className="text-base font-extrabold text-teal-dark">
                      {selectedProduct.physicalStock}{' '}
                      <small className="font-normal">
                        ({selectedProduct.packagingUnit})
                      </small>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-dark/80">
                      Comprometido en Fila:
                    </span>
                    <span className="font-extrabold text-coral-dark">
                      {selectedProduct.committedStock}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-dashed border-teal/30 pt-1 text-xs">
                    <span className="font-bold text-teal-dark">
                      Disponible Real (ATP):
                    </span>
                    <span
                      className={`font-extrabold ${
                        selectedProduct.availableStock < 0
                          ? 'text-coral-dark'
                          : 'text-teal-dark'
                      }`}
                    >
                      {selectedProduct.availableStock}
                    </span>
                  </div>
                </AccentCard>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-teal-dark">
                Cantidad ({selectedProduct?.packagingUnit ?? 'Unidades'})
              </label>
              <div className="flex items-center gap-2">
                <CounterButton
                  direction="minus"
                  label="-5"
                  onClick={() => adjustQty(-5)}
                  disabled={quantity <= 5}
                />
                <CounterButton
                  direction="minus"
                  label="-1"
                  onClick={() => adjustQty(-1)}
                  disabled={quantity <= 1}
                />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value, 10);
                    setQuantity(Number.isFinite(val) && val > 0 ? val : 1);
                  }}
                  className="cream-input w-20 text-center text-lg font-extrabold"
                />
                <CounterButton
                  direction="plus"
                  label="+1"
                  onClick={() => adjustQty(1)}
                />
                <CounterButton
                  direction="plus"
                  label="+5"
                  onClick={() => adjustQty(5)}
                />
                <CounterButton
                  direction="plus"
                  label="+10"
                  onClick={() => adjustQty(10)}
                />
              </div>

              {movementType === 'OUT' &&
                selectedProduct &&
                selectedProduct.committedStock > 0 && (
                  <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 border-teal/30 bg-cream p-3 text-xs font-bold text-teal-dark">
                    <input
                      type="checkbox"
                      checked={fulfillsCommittedOrder}
                      onChange={(e) =>
                        setFulfillsCommittedOrder(e.target.checked)
                      }
                      className="h-4 w-4 accent-teal-dark"
                    />
                    <span>
                      Despacha orden comprometida en la fila (descuenta también de
                      Stock Comprometido)
                    </span>
                  </label>
                )}

              {exceedsPhysicalStock && selectedProduct && (
                <div className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-coral-dark bg-coral/15 p-3 text-xs font-bold text-coral-dark shadow-coral-glow">
                  <AlertOctagon className="h-5 w-5 shrink-0" />
                  <span>
                    Bloqueo Poka-Yoke: Intentas retirar {quantity}, pero solo
                    existen {selectedProduct.physicalStock} en estantería.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trazabilidad de Documento y Operario */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-teal-dark">
                Documento Referencia
              </label>
              <input
                type="text"
                required
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder="Ej. OC-FILA-201"
                className="cream-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-teal-dark">
                Operario Responsable
              </label>
              <input
                type="text"
                required
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Ej. Carlos_Turno1"
                className="cream-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-teal-dark">
                Nota Opcional
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Carril rápido / proveedor..."
                className="cream-input w-full"
              />
            </div>
          </div>

          {submitError && (
            <div className="rounded-2xl border-2 border-coral-dark bg-coral/15 p-3 text-xs font-extrabold text-coral-dark">
              {submitError}
            </div>
          )}

          {/* CLIC 3: Confirmación Transaccional */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t-[3px] border-dashed border-teal/35 pt-4">
            <PillButton variant="cream" onClick={onClose}>
              Cancelar
            </PillButton>
            <PillButton
              type="submit"
              variant="gold"
              size="lg"
              disabled={submitting || exceedsPhysicalStock || !selectedProduct}
            >
              <CheckCircle2 className="h-5 w-5" />
              {submitting
                ? 'Ejecutando Transacción ACID...'
                : 'Clic 3 — Confirmar y Auditar en Kardex'}
            </PillButton>
          </div>
        </form>
      </div>
    </div>
  );
}
