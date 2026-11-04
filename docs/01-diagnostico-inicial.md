# 🚨 Informe de Diagnóstico e Intervención Operativa: Almacén Central

- **Para:** Gerencia de Operaciones / Equipo Directivo (Juliam Corp LLC)
- **De:** Ingeniería de Software / Infraestructura
- **Fecha:** 03 de Noviembre de 2026
- **Prioridad:** Crítica (P0 - Impacto directo en ventas y línea de despacho)

---

## 1. Resumen Ejecutivo

El almacén central no enfrenta únicamente un problema de *"archivos desordenados"*, sino una **ruptura entre el inventario contable/comercial** (lo que se vende a distribuidores) y el **inventario físico real en estantería**.

Actualmente se está vendiendo "a ciegas". El equipo comercial genera órdenes de compra asumiendo que hay mercancía, y el cliente recién descubre que no hay stock cuando llega a la puerta del almacén a retirar su pedido. Esto genera filas eternas, retrabajo en pasillos buscando cajas inexistentes y quiebres de stock silenciosos.

---

## 2. Diagnóstico de Causas Raíz

1. **Fragmentación de la Fuente de la Verdad (Data Silos):** La coexistencia del archivo original junto con los nuevos Excels creados por los dos operarios recién incorporados destruyó la integridad referencial. Una entrada registrada en el "Excel A" y una salida en el "Excel B" hacen imposible conocer el saldo real sin cruzar archivos manualmente.
2. **Inconsistencia en Nomenclatura y Entrada de Datos Libre:** Al usar hojas de cálculo abiertas sin validación de celdas, cada operario registra los productos con formatos distintos (ej. `SKU-001`, `sku 001` o texto libre como `"32 cajas"` en campos numéricos), rompiendo cualquier fórmula o cruce automático.
3. **Automatización Frágil sin Gobernanza (Macros en Excel):** Las macros generadas de forma aislada resuelven tareas locales rápidas, pero carecen de control de concurrencia (no soportan múltiples operarios al mismo tiempo), no validan stock negativo y no dejan trazabilidad de auditoría (Kardex).
4. **Ausencia del concepto de "Stock Comprometido" (Available to Promise - ATP):** El almacén intenta operar mirando solo *"cuántas cajas hay en el piso"*, sin restar en tiempo real las cajas que ya están vendidas en las órdenes de compra de los distribuidores que vienen en camino a retirar.

---

## 3. Procesos de Negocio Críticos Impactados

- **Línea de Despacho y Picking (Impacto Crítico Inmediato):** Cuello de botella severo. Cuando un operario va a buscar un pedido de vasos o contenedores y descubre que el estante está vacío, toda la fila de despacho se detiene mientras se busca mercancía o se gestionan devoluciones/cambios en caliente.
- **Compras y Reabastecimiento (Riesgo Financiero):** Ceguera operativa. Sin un Punto de Reorden (*Stock Mínimo*) cruzado contra el inventario real, la empresa corre dos riesgos fatales: quedarse sin los productos de alta rotación (Pareto 80/20) o comprar a ciegas insumos que ya sobran en el almacén, congelando el flujo de caja.
- **Ventas y Relación con Distribuidores/Restaurantes:** En el sector gastronómico, un restaurante que se queda sin empaques para delivery o servilletas un viernes no espera: le compra a la competencia inmediatamente.

---

## 4. Estructura de Datos Mínima para Recuperar el Control

Para detener la hemorragia operativa en menos de 48 horas y migrar hacia el sistema centralizado, no necesitamos reconstruir el histórico de todo el año; necesitamos establecer una **Línea Base de Auditoría (Corte de Inventario)** apoyada en 3 entidades esenciales:

### A. Catálogo Maestro Unificado (SKUs)
Elimina la ambigüedad entre operarios. Nadie escribe nombres a mano; todo se referencia por código único y unidad de empaque comercial:
- `sku_code` (PK - Ej: `SKU-001`, normalizado en mayúsculas y sin espacios).
- `nombre_producto` (Ej: *Contenedor Plástico Bisagra 8x8*).
- `categoria` (*Contenedores, Vasos, Cubiertos, Papel, Vidrio, Empaques*).
- `unidad_empaque` (Crucial en este giro: *Caja x200, Caja x1000, Bulto x6000*).
- `stock_minimo_alerta` (Punto de reorden bajo el cual se dispara alerta de compra a proveedor).

### B. Registro Transaccional de Movimientos (Kardex Inmutable)
En lugar de sobrescribir una celda con el número de stock (lo que borra el rastro de quién se equivocó), todo cambio de inventario es un evento auditable:
- `movimiento_id` (UUID / Autoincremental).
- `fecha_hora` (Timestamp exacto).
- `sku_code` (FK hacia Catálogo).
- `tipo_movimiento` (`CORTE_INICIAL`, `ENTRADA_PROVEEDOR`, `SALIDA_DESPACHO`, `AJUSTE_MERMA`).
- `cantidad` (Entero positivo validado).
- `documento_referencia` (N° de Orden de Compra de distribuidor o Factura de proveedor).
- `operador_responsable` (Identificador del trabajador).

### C. Matriz de Visibilidad Operativa (La Ecuación de Rescate)
Para eliminar las filas en el almacén y saber qué pedir hoy, el sistema (tanto en el script de contingencia de Fase A como en la Web App de Fase B) calcula en vivo tres métricas distintas por cada SKU:

1. **Stock Físico (`physical_stock`):** Existencia real consolidada en estantería (`CORTE_INICIAL + ENTRADAS - SALIDAS ± AJUSTES`).
2. **Stock Comprometido (`committed_stock`):** Unidades ya vendidas en órdenes de compra activas de distribuidores pendientes de retiro en fila.
3. **Stock Disponible Real / ATP (`available_stock`):**

$$\text{Stock Disponible Real (ATP)} = \text{Stock Físico} - \text{Stock Comprometido}$$

$$\text{Condición de Reabastecimiento Urgente}: \quad \text{Stock Disponible Real} \le \text{Stock Mínimo de Alerta}$$

$$\text{Cantidad Sugerida a Pedir} = (\text{Stock Mínimo de Alerta} - \text{Stock Disponible Real}) + \text{Margen de Seguridad}$$

- **Por qué esto resuelve la crisis hoy:** Si en el estante hay **20 cajas** de vasos (*Stock Físico*), pero afuera en la fila hay órdenes de compra ya pagadas por **28 cajas** (*Stock Comprometido*), nuestro *Stock Disponible Real* es **-8 cajas**. Esto nos avisa en el minuto cero qué órdenes de la fila tienen cobertura garantizada (pasan por un carril rápido de despacho) y qué insumos requieren una orden de compra de emergencia al proveedor hoy mismo.

---

## 5. Plan de Acción Escalonado (Próximas 72 Horas)

1. **Día 1 (Fase A - Contingencia Inmediata):**
   - Congelamiento inmediato de los archivos Excel individuales.
   - Ejecución de un script automatizado de sanitización y consolidación (`consolidate.ts`) que cruza el inventario base, las hojas de los nuevos operarios (limpiando errores de tipeo en SKUs y cantidades) y las órdenes de compra activas.
   - Generación automática del primer reporte `URGENTE_orden_reabastecimiento.csv` para que Compras pida mercancía hoy mismo, acompañado de un manual operativo de 1 página para el personal de piso y conteo físico rápido (*Cycle Count*) de los 20 productos de mayor rotación.
2. **Días 2 y 3 (Fase B - MVP Web Centralizado en React + NestJS + Docker):**
   - Puesta en marcha de la aplicación web contenerizada con PostgreSQL.
   - Bloqueo por diseño de errores humanos: formularios de despacho en 3 clics, transacciones ACID en base de datos para impedir inconsistencias cuando dos operarios despachan a la vez, y un panel en tiempo real de alertas de reabastecimiento.
3. **Día 4 (Fase 3 - Arquitectura Estratégica Definitiva):**
   - Entrega del diseño arquitectónico industrial integrando un core ERP administrativo con un sistema ligero de gestión de almacenes (WMS) por lectura de códigos de barras/QR.
