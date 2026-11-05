# 🛡️ Juliam Corp LLC — Infraestructura de Inventario, Contingencia Operativa y MVP Centralizado

**Autor:** Pedro Ignacio Centeno Cabrera  
**Caso de Estudio:** Resolución de Incidencias en Línea de Despacho, Saneamiento de Datos y Migración hacia Sistema Centralizado Transaccional (ATP & Kardex ACID).  
**Stack Técnico:** TypeScript · React 18 (Vite + TailwindCSS) · NestJS 10 · Prisma ORM · PostgreSQL 16 · Docker & Docker Compose

---

## ⚡ Inicio Rápido en 1 Comando (Docker First)

Toda la infraestructura de la **Fase B (PostgreSQL 16 + Migraciones Prisma + Seeder con datos reales de Fase A + Backend NestJS + Frontend React)** se levanta de forma autónoma sin configuraciones manuales:

```bash
docker compose up --build
```

Una vez que los contenedores estén activos:
- 🖥️ **Aplicación Web Operativa (Dashboard ATP + Modal 3 Clics + Bitácora Kardex):** [http://localhost:5173](http://localhost:5173) *(también en [http://localhost:8080](http://localhost:8080))*
- 🩺 **Healthcheck Backend API:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- 📊 **Endpoint KPIs de Almacén:** [http://localhost:3000/api/products/kpis](http://localhost:3000/api/products/kpis)

---

## 🗺️ Mapa de Entregables (Estructura del Repositorio)

| Entregable de la Prueba | Ubicación en el Repositorio | Descripción |
| :--- | :--- | :--- |
| **1. Diagnóstico Inicial** | [`docs/01-diagnostico-inicial.md`](./docs/01-diagnostico-inicial.md) | Análisis de causas raíz (fragmentación de Excels, falta de Stock Comprometido), procesos impactados y definición de la **Ecuación de Rescate (ATP)**. |
| **2. Solución Low-Code / Contingencia (Fase A)** | [`fase-a-contingencia/`](./fase-a-contingencia/) | Datasets sucios simulados, motor [`consolidate.ts`](./fase-a-contingencia/consolidate.ts) (0 dependencias), reporte [`URGENTE_orden_reabastecimiento.csv`](./fase-a-contingencia/output/URGENTE_orden_reabastecimiento.csv), [`MANUAL_OPERATIVO_DIA_1.md`](./fase-a-contingencia/MANUAL_OPERATIVO_DIA_1.md) y [`plantilla_maestra_contingencia.xlsx`](./fase-a-contingencia/plantilla_maestra_contingencia.xlsx) con validaciones Poka-Yoke. |
| **3. MVP Web Centralizado — Backend (Fase B)** | [`backend/`](./backend/) | API REST en **NestJS + Prisma + PostgreSQL** con transacciones ACID (`Serializable`), protección contra stock negativo y Seeder automático desde Fase A. |
| **4. MVP Web Centralizado — Frontend (Fase B)** | [`frontend/`](./frontend/) | Aplicación **React + TypeScript + Tailwind** con componentes DRY reutilizables, Matriz de Visibilidad ATP, filtro de compras urgentes, exportación CSV y Modal Poka-Yoke de 3 clics. |
| **5. Guía Técnica del MVP & Docker** | [`docs/02-documentacion-tecnica-mvp.md`](./docs/02-documentacion-tecnica-mvp.md) | Explicación técnica del modelo de datos, invariantes transaccionales, endpoints y guía de despliegue Docker. |
| **6. Propuesta Arquitectónica Industrial (Fase 3)** | [`docs/03-arquitectura-largo-plazo.md`](./docs/03-arquitectura-largo-plazo.md) | Diseño a largo plazo evaluando integración **ERP + CRM + Edge WMS Custom**, lectores de códigos de barras **GS1-128/QR** y bus de eventos asíncrono. |
| **7. Gobernanza Técnica y Flujo de Ingeniería** | [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) | Reglas de negocio innegociables, estrategia Git Flow (`main` ← `develop` ← `feat/*`) y Roadmap Tracker. |

---

## 🧮 La Ecuación de Rescate Operativa (El Núcleo de la Solución)

El colapso en la línea de despacho ocurría porque el almacén miraba únicamente las cajas físicas en estantería sin descontar las órdenes de compra ya vendidas a distribuidores que venían en camino a retirar. Tanto el consolidador de **Fase A** como el MVP Web de **Fase B** calculan en tiempo real:

$$\text{Stock Disponible Real (ATP)} = \text{Stock Físico en Piso} - \text{Stock Comprometido en Fila}$$

- **Caso real detectado en la auditoría (`SKU-002` — Vaso Térmico Polipropileno 12oz Con Tapa):**
  - Stock Físico en estante: **20 cajas** (`25 inicial - 10 salida + 5 entrada`).
  - Stock Comprometido en fila de espera: **28 cajas** (`OC-FILA-201` por 16 cajas + `OC-FILA-202` por 12 cajas).
  - **Stock Disponible Real (ATP): `-8 cajas` (`CRITICO_QUIEBRE_FILA`).**
  - **Acción inmediata:** La orden `OC-FILA-201` (16 cajas) pasa por **Carril Rápido**, mientras que `OC-FILA-202` (12 cajas) se atiende en **Ventanilla de Incidencias** ofreciendo las 4 cajas restantes sin detener al resto de camiones de la fila, y disparando una orden de compra urgente por **38 cajas**.

---

## 🧪 Comandos de Verificación por Fase

### A. Probar la Fase A (Contingencia Operativa — Cero Dependencias)
```bash
# 1. Ejecutar el motor de sanitización de SKUs y consolidación ATP
node fase-a-contingencia/consolidate.ts

# 2. Regenerar el libro Excel maestro con validaciones Poka-Yoke y fórmulas SUMIFS
node fase-a-contingencia/generate-excel-template.ts
```

### B. Probar las Reglas de Negocio y Compilación del Backend (Fase B)
```bash
cd backend
npm test
npm run build
```

### C. Levantar Todo el Entorno en Docker (Fase B Completa)
```bash
docker compose up --build
```
*(Para detener y limpiar contenedores: `docker compose down`).*
