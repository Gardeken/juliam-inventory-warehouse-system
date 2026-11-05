# 📋 MANUAL OPERATIVO DÍA 1: Protocolo de Contingencia en Almacén Central

**Para:** Equipo de Piso de Almacén, Despacho y Compras (Juliam Corp LLC)  
**Vigencia:** Inmediata (Día 1 — Contingencia previa al lanzamiento del Sistema Web Centralizado)  
**Objetivo:** Eliminar la fila de clientes en puerta hoy mismo, unificar el control de cajas/bultos en una sola fuente y emitir la orden de compra urgente sin errores de tipeo.

---

## 🛑 REGLA DE ORO DESDE ESTE MINUTO (CERO EXCELS PARALELOS)

1. **Quedan congelados y prohibidos** los archivos individuales (`excel_operario_1`, `excel_operario_2` o cualquier copia personal en escritorio).
2. **Nadie sobrescribe el número de stock a mano.** Todo movimiento de mercancía se anota como una fila nueva en el registro de movimientos (*Kardex*).
3. **Prohibido escribir letras en la columna de Cantidad:**
   - ❌ **Incorrecto:** `"12 cajas"`, `"8 bultos"`, `"pendiente"`, `"-5"`
   - ✅ **Correcto:** `12`, `8` (la unidad de empaque ya está definida automáticamente por el código SKU).
4. **Prohibido inventar códigos SKU:** Usa siempre la lista desplegable oficial (`SKU-001` al `SKU-012`).

---

## ⚡ PASO 1: Destrabar la Fila de Despacho en Puerta (Primeros 15 Minutos)

Con el corte consolidado ya ejecutado, el archivo [`output/triaje_fila_despacho.csv`](./output/triaje_fila_despacho.csv) divide a los camiones/clientes que están esperando afuera en **dos carriles**:

### 🟢 Carril Rápido (Despacho Inmediato — 9 Órdenes Garantizadas)
Cuentan con mercancía física suficiente en estantería. **Pasan directo a carga sin detener la fila:**
- `OC-FILA-201` — Distribuidora Gastronómica El Chef (`SKU-002`: 16 cajas de Vaso Térmico 12oz)
- `OC-FILA-203` — Grupo Restaurantero La Brasa (`SKU-001`: 18 cajas de Contenedor Bisagra 8x8)
- `OC-FILA-204` — Empaques y Desechables Del Sur (`SKU-004`: 14 bultos de Servilleta Interfoliada)
- `OC-FILA-205` — Distribuidora Gastronómica El Chef (`SKU-006`: 12 bultos de Bolsa Kraft Mediana)
- `OC-FILA-206` — Catering & Eventos Metropolitanos (`SKU-007`: 10 cajas de Contenedor Negro 24oz)
- `OC-FILA-207` — Suministros Horeca Express (`SKU-009`: 6 cajas de Rollo Papel Aluminio Industrial)
- `OC-FILA-208` — Franquicias Burger & Grill (`SKU-003`: 15 cajas de Cubiertos Biodegradables)
- `OC-FILA-209` — Café & Bakery Distribuciones (`SKU-008`: 10 cajas de Vaso PET 16oz)
- `OC-FILA-210` — Restaurantes Unidos del Este (`SKU-011`: 8 cajas de Tenedor Reforzado Negro)

### 🔴 Ventanilla de Incidencias (Retenido por Quiebre — 1 Orden)
Retirar de la fila principal para no bloquear a los demás camiones y atender por separado:
- **`OC-FILA-202` — Suministros Horeca Express (`SKU-002`: Vaso Térmico 12oz Con Tapa):**
  - **Situación:** Pide **12 cajas**, pero tras despachar el turno anterior (`OC-FILA-201`) solo quedan **4 cajas físicas** en piso (faltan 8 cajas).
  - **Acción inmediata:** Ofrecer entrega parcial inmediata de **4 cajas** + nota de prioridad para las **8 cajas** restantes en cuanto ingrese el camión del proveedor.

---

## 📦 PASO 2: Orden de Compra Urgente y Conteo Rápido (Minuto 30)

1. **Compras:** Descargar y enviar a proveedores el archivo [`output/URGENTE_orden_reabastecimiento.csv`](./output/URGENTE_orden_reabastecimiento.csv).
   - **Prioridad #1 (`CRITICO_QUIEBRE_FILA`):** `SKU-002` (Vaso Térmico 12oz) — Stock Disponible Real (ATP): **-8 cajas** → Pedir **38 cajas** hoy mismo.
   - **Prioridad #2 (`URGENTE_REORDEN`):** 8 insumos cuyo Stock Disponible Real cayó por debajo del Stock Mínimo tras descontar la fila (`SKU-004`, `SKU-009`, `SKU-007`, `SKU-006`, `SKU-011`, `SKU-001`, `SKU-008`, `SKU-003`).
2. **Jefe de Almacén (Conteo Rápido / Cycle Count):**
   - Antes de abrir el turno de la tarde, verificar visualmente en pasillo únicamente los **4 SKUs con menor margen disponible**:
     - `SKU-002` (Vaso Térmico 12oz): Deben verse **20 cajas** antes de despachar la fila (**4 cajas** tras despachar `OC-FILA-201`).
     - `SKU-004` (Servilleta Interfoliada): Deben verse **16 bultos** en estante.
     - `SKU-009` (Aluminio Industrial 18x500): Deben verse **8 cajas** en estante.
     - `SKU-007` (Contenedor Negro 24oz): Deben verse **13 cajas** en estante.

---

## 📊 PASO 3: Cómo Usar la Plantilla Maestra (`plantilla_maestra_contingencia.xlsx`)

Mientras el equipo de tecnología habilita la aplicación web centralizada en las próximas horas, **toda la operación del Día 1 se registra en [`plantilla_maestra_contingencia.xlsx`](./plantilla_maestra_contingencia.xlsx)**:

| Pestaña del Excel | ¿Quién la toca? | ¿Para qué sirve? |
| :--- | :--- | :--- |
| **`1_Catalogo_SKUs`** | 🔒 Solo Lectura | Lista oficial de los 12 códigos SKU, unidad de empaque y stock consolidado de arranque. **No modificar.** |
| **`2_Registro_Kardex`** | 👷 Operarios de Piso | **Único lugar donde se anotan entradas, salidas y mermas.** Tiene listas desplegables y bloquea textos o números negativos. |
| **`3_Ordenes_En_Fila`** | 🧾 Recepción / Ventas | Registro de órdenes de compra pagadas que están esperando turno de carga en puerta. |
| **`4_Tablero_ATP_Compras`** | 📈 Automático (Fórmulas) | Calcula solo y en vivo el **Stock Físico**, el **Stock Comprometido en Fila**, el **Stock Disponible Real (ATP)** y la alerta de compra. |

### Instrucciones de Registro en 3 Pasos para el Operario (`2_Registro_Kardex`):
1. **Columna `SKU_Code`:** Haz clic en la flecha desplegable de la celda y elige el código (ej. `SKU-001`). Si intentas escribir un código inventado, Excel bloqueará la celda.
2. **Columna `Tipo_Movimiento`:** Elige de la lista: `ENTRADA`, `SALIDA` o `AJUSTE_MERMA`.
3. **Columna `Cantidad`:** Escribe **solo el número entero** de cajas o bultos (ej. `10`). Si escribes `"10 cajas"` o `-5`, Excel mostrará una alerta de error y no permitirá guardar el dato sucio.

---

## 🖥️ PASO 4: Cómo Ejecutar el Motor de Consolidación Automática (Opcional / Auditoría)

Si en cualquier momento necesitas volver a cruzar archivos CSV exportados para regenerar los reportes limpios y el archivo de reabastecimiento urgente:

1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta este único comando:
   ```bash
   node fase-a-contingencia/consolidate.ts
   ```
3. Revisa los reportes actualizados dentro de la carpeta `fase-a-contingencia/output/`:
   - `URGENTE_orden_reabastecimiento.csv`: Qué pedir a proveedores.
   - `triaje_fila_despacho.csv`: Qué clientes de la fila pasan por Carril Rápido.
   - `inventario_consolidado_limpio.csv`: Radiografía completa del almacén.
   - `auditoria_errores_datos.log`: Lista exacta de errores humanos detectados y bloqueados.

