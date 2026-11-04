# 🛡️ AI Governance & Engineering Spec (Spec-Driven Development)

**Autor:** Pedro Ignacio Centeno Cabrera  
**Propósito:** Este documento define las reglas arquitectónicas, restricciones de negocio y el flujo de trabajo incremental utilizado para dirigir asistentes de IA durante el desarrollo, garantizando código auditable, sin alucinaciones y alineado 100% a las necesidades operativas de Juliam Corp LLC.

## 🛠️ Instrucciones de Flujo de Trabajo con Git:
1. Crea y trabaja siempre sobre `develop` (o ramas `feat/fase-X`).
2. Nunca hagas commits directos a `main` hasta tener todo el MVP y la Dockerización 100% probados localmente.
3. Al finalizar, realiza un merge de `develop` a `main` para la entrega final del repositorio público.

---

## 1. Reglas de Gobernanza Técnica y Calidad de Código

1. **Aislamiento de Alcance por Fases (Incremental Delivery):**
   - El desarrollo se ejecuta de forma secuencial. Ningún módulo nuevo se implementa sin antes validar y versionar la fase previa.
   - Se prohíbe la modificación cruzada de archivos fuera del módulo activo para mantener commits atómicos y trazables.

2. **Reglas de Negocio Innegociables (Dominio de Almacén):**
   - **Prohibición de Mutación Directa de Stock:** Ningún endpoint puede hacer un `UPDATE` directo sobre el saldo de un producto. Todo cambio de inventario debe ejecutarse dentro de una **Transacción ACID (`prisma.$transaction`)** que registre simultáneamente el evento inmutable en el Kardex (`InventoryMovement`).
   - **Separación de Stock Físico vs. Stock Comprometido (ATP):** El sistema debe distinguir siempre entre lo que hay en estantería (`physicalStock`) y lo que ya fue vendido en órdenes de compra pendientes en la fila (`committedStock`). El cálculo de reabastecimiento se rige por:
     `availableStock = physicalStock - committedStock`
   - **Protección contra Stock Negativo:** El backend rechaza a nivel de servicio cualquier intento de salida física (`OUT`) que supere el `physicalStock` actual en piso.

3. **Estándares de Limpieza y Portabilidad:**
   - **Cero Código Muerto o Comentarios Redundantes:** Solo se documentan decisiones de negocio críticas o fórmulas de cálculo de stock.
   - **Portabilidad Docker First:** Toda dependencia (PostgreSQL, Migraciones de Prisma, Seeder con datos de Fase A, Backend NestJS y Frontend React) debe levantar de forma autónoma mediante `docker-compose up --build`.

4. **Estrategia de Ramas y Git Flow (Branching Strategy):**
   - **`main` (Producción / Entregable Final):** Rama protegida. Solo contendrá código completamente probado, funcional y dockerizado listo para la revisión final de Juliam Corp.
   - **`develop` (Integración de Desarrollo):** Rama base donde se integrarán progresivamente las fases del proyecto.
   - **Ramas de Característica (`feat/*` o `fix/*`):** Cada fase o componente se desarrollará en una rama temporal que luego se fusionará a `develop` mediante commits limpios y estructurados.

---

## 2. Estado de Ejecución del Proyecto (Roadmap Tracker)

**Leyenda:** `🟢 COMPLETADO` | `🟡 EN PROGRESO` | `⚪ PENDIENTE`

### Fase 1: Diagnóstico e Intervención Inicial
- [🟢 COMPLETADO] **1.1 Diagnóstico de Causas Raíz y Modelo de Datos:** Análisis del colapso en línea de despacho y definición de la ecuación de rescate (`docs/01-diagnostico-inicial.md`).

### Fase 2: Contingencia Operativa en Horas (Fase A - Low-Code)
- [🟢 COMPLETADO] **2.1 Dataset Simulado de Incidencia:** Archivos CSV con errores reales de operación (SKUs mal tipeados, textos en campos numéricos y órdenes en fila).
- [🟢 COMPLETADO] **2.2 Motor de Sanitización y Consolidación (`consolidate.ts`):** Script sin dependencias externas que normaliza SKUs, unifica saldos y genera `URGENTE_orden_reabastecimiento.csv`.
- [🟢 COMPLETADO] **2.3 Protocolo Operativo Día 1 y Plantilla Maestra:** Manual para operarios no técnicos (`MANUAL_OPERATIVO_DIA_1.md`) y libro Excel con validaciones anti-error (`plantilla_maestra_contingencia.xlsx`).

### Fase 3: MVP Web Centralizado - Backend (Fase B)
- [🟢 COMPLETADO] **3.1 Base de Datos y ORM:** Configuración de NestJS + Prisma con modelos `Product` e `InventoryMovement`.
- [🟢 COMPLETADO] **3.2 Módulo de Catálogo y Alertas de Reabastecimiento:** Cálculo dinámico de Punto de Reorden (`availableStock <= minStock`).
- [🟢 COMPLETADO] **3.3 Motor Transaccional de Kardex:** Endpoints de Entrada, Salida y Ajuste con bloqueo de concurrencia/transacción.
- [🟢 COMPLETADO] **3.4 Seeder de Continuidad Operativa:** Carga automática de los insumos gastronómicos consolidados en la Fase A.

### Fase 4: MVP Web Centralizado - Frontend y Docker (Fase B)
- [🟢 COMPLETADO] **4.1 Dashboard de Visibilidad de Almacén:** Interfaz en React + Tailwind con KPIs críticos y filtro de compras urgentes.
- [🟢 COMPLETADO] **4.2 Modal Poka-Yoke de Despacho Rápido:** Registro de movimientos en 3 clics para operarios de piso.
- [🟢 COMPLETADO] **4.3 Orquestación Docker Compose:** Empaquetado completo con `healthchecks` y auto-migración.

### Fase 5: Arquitectura Estratégica (Fase 3)
- [⚪ PENDIENTE] **5.1 Propuesta Industrial a Largo Plazo:** Diseño de integración híbrida ERP + WMS con lectores de código de barras y bus de eventos (`docs/03-arquitectura-largo-plazo.md`).