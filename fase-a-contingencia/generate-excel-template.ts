/// <reference path="./node-builtins.d.ts" />
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

interface SeedData {
  products: {
    skuCode: string;
    name: string;
    category: string;
    packagingUnit: string;
    initialStock: number;
    totalEntries: number;
    totalExits: number;
    totalShrinkage: number;
    physicalStock: number;
    committedStock: number;
    availableStock: number;
    minStockAlert: number;
    status: string;
    suggestedOrderQty: number;
    estimatedOrderCostUsd: number;
  }[];
  sanitizedMovements: {
    timestamp: string;
    skuCode: string;
    eventType: string;
    quantity: number;
    referenceDoc: string;
    operator: string;
  }[];
  pendingOrders: {
    orderId: string;
    distributorName: string;
    skuCode: string;
    committedQty: number;
    queuePriority: string;
    arrivalTime: string;
  }[];
}

interface CellDef {
  value?: string | number;
  formula?: string;
  style?: number;
}

interface DataValidationRule {
  sqref: string;
  type: 'list' | 'whole';
  operator?: 'greaterThan';
  formula1: string;
  errorTitle: string;
  errorMessage: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colIndexToLetter(colIdx: number): string {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function buildWorksheetXml(
  rows: CellDef[][],
  colWidths: number[],
  validations: DataValidationRule[] = [],
): string {
  const colsXml = colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const rowsXml = rows
    .map((cells, rIdx) => {
      const rowNum = rIdx + 1;
      const cellsXml = cells
        .map((cell, cIdx) => {
          const ref = `${colIndexToLetter(cIdx)}${rowNum}`;
          const styleAttr = cell.style !== undefined ? ` s="${cell.style}"` : '';

          if (cell.formula !== undefined) {
            const cachedVal =
              typeof cell.value === 'number'
                ? `<v>${cell.value}</v>`
                : cell.value !== undefined
                  ? `<v>${escapeXml(String(cell.value))}</v>`
                  : '';
            const typeAttr = typeof cell.value === 'string' ? ' t="str"' : '';
            return `<c r="${ref}"${styleAttr}${typeAttr}><f>${escapeXml(cell.formula)}</f>${cachedVal}</c>`;
          }

          if (typeof cell.value === 'number') {
            return `<c r="${ref}"${styleAttr}><v>${cell.value}</v></c>`;
          }

          const text = cell.value !== undefined ? String(cell.value) : '';
          return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t>${escapeXml(text)}</t></is></c>`;
        })
        .join('');

      return `<row r="${rowNum}">${cellsXml}</row>`;
    })
    .join('');

  const validationsXml =
    validations.length > 0
      ? `<dataValidations count="${validations.length}">${validations
          .map((v) => {
            const opAttr = v.operator ? ` operator="${v.operator}"` : '';
            return `<dataValidation type="${v.type}"${opAttr} allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="${escapeXml(v.errorTitle)}" error="${escapeXml(v.errorMessage)}" sqref="${v.sqref}"><formula1>${escapeXml(v.formula1)}</formula1></dataValidation>`;
          })
          .join('')}</dataValidations>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
  ${validationsXml}
</worksheet>`;
}

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Empaqueta archivos XML en un contenedor ZIP estándar (OpenXML .xlsx) sin dependencias externas.
 */
function buildZipArchive(files: { name: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);
    const crc = computeCrc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x2164, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x2164, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLength = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of [...localParts, ...centralParts, eocd]) {
    output.set(part, pos);
    pos += part.length;
  }
  return output;
}

function generateExcelTemplate(): void {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const seedPath = path.join(currentDir, 'output', 'inventario_consolidado_seed.json');
  const seed: SeedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  // Hoja 1: 1_Catalogo_SKUs
  const sheet1Rows: CellDef[][] = [
    [
      { value: 'SKU_CODE', style: 1 },
      { value: 'NOMBRE_PRODUCTO', style: 1 },
      { value: 'CATEGORIA', style: 1 },
      { value: 'UNIDAD_EMPAQUE', style: 1 },
      { value: 'CORTE_INICIAL_BASE', style: 1 },
      { value: 'STOCK_MINIMO_ALERTA', style: 1 },
    ],
    ...seed.products.map((p) => [
      { value: p.skuCode },
      { value: p.name },
      { value: p.category },
      { value: p.packagingUnit },
      { value: p.initialStock },
      { value: p.minStockAlert },
    ]),
  ];

  // Hoja 2: 2_Registro_Kardex (Con validaciones Poka-Yoke)
  const sheet2Rows: CellDef[][] = [
    [
      { value: 'FECHA_HORA', style: 1 },
      { value: 'SKU_CODE', style: 1 },
      { value: 'TIPO_MOVIMIENTO', style: 1 },
      { value: 'CANTIDAD_UNIDADES', style: 1 },
      { value: 'DOCUMENTO_REFERENCIA', style: 1 },
      { value: 'OPERARIO_RESPONSABLE', style: 1 },
    ],
    ...seed.sanitizedMovements.map((m) => [
      { value: m.timestamp },
      { value: m.skuCode },
      { value: m.eventType },
      { value: m.quantity },
      { value: m.referenceDoc },
      { value: m.operator },
    ]),
  ];

  const sheet2Validations: DataValidationRule[] = [
    {
      sqref: 'B2:B500',
      type: 'list',
      formula1: "'1_Catalogo_SKUs'!$A$2:$A$13",
      errorTitle: 'Bloqueo Poka-Yoke: SKU No Oficial',
      errorMessage:
        'Prohibido escribir SKUs libres. Selecciona un código válido (SKU-001 a SKU-012) de la lista desplegable.',
    },
    {
      sqref: 'C2:C500',
      type: 'list',
      formula1: '"ENTRADA,SALIDA,AJUSTE_MERMA"',
      errorTitle: 'Bloqueo Poka-Yoke: Tipo de Movimiento Inválido',
      errorMessage: 'Elige únicamente ENTRADA, SALIDA o AJUSTE_MERMA.',
    },
    {
      sqref: 'D2:D500',
      type: 'whole',
      operator: 'greaterThan',
      formula1: '0',
      errorTitle: 'Bloqueo Poka-Yoke: Cantidad Inválida',
      errorMessage:
        'Ingresa solo números enteros mayores a 0. Prohibido escribir textos como "12 cajas" o valores negativos.',
    },
  ];

  // Hoja 3: 3_Ordenes_En_Fila
  const sheet3Rows: CellDef[][] = [
    [
      { value: 'ORDEN_ID', style: 1 },
      { value: 'DISTRIBUIDOR_CLIENTE', style: 1 },
      { value: 'SKU_CODE', style: 1 },
      { value: 'CANTIDAD_COMPROMETIDA', style: 1 },
      { value: 'PRIORIDAD_FILA', style: 1 },
      { value: 'HORA_LLEGADA', style: 1 },
    ],
    ...seed.pendingOrders.map((o) => [
      { value: o.orderId },
      { value: o.distributorName },
      { value: o.skuCode },
      { value: o.committedQty },
      { value: o.queuePriority },
      { value: o.arrivalTime },
    ]),
  ];

  const sheet3Validations: DataValidationRule[] = [
    {
      sqref: 'C2:C200',
      type: 'list',
      formula1: "'1_Catalogo_SKUs'!$A$2:$A$13",
      errorTitle: 'SKU Inválido en Orden de Compra',
      errorMessage: 'Selecciona un SKU válido del Catálogo Maestro.',
    },
    {
      sqref: 'D2:D200',
      type: 'whole',
      operator: 'greaterThan',
      formula1: '0',
      errorTitle: 'Cantidad Inválida',
      errorMessage: 'La cantidad comprometida debe ser un número entero mayor a 0.',
    },
  ];

  // Hoja 4: 4_Tablero_ATP_Compras (Con fórmulas dinámicas SUMIFS y ecuación de rescate)
  const sheet4Rows: CellDef[][] = [
    [
      { value: 'SKU_CODE', style: 1 },
      { value: 'NOMBRE_PRODUCTO', style: 1 },
      { value: 'UNIDAD_EMPAQUE', style: 1 },
      { value: 'CORTE_INICIAL', style: 1 },
      { value: 'ENTRADAS', style: 1 },
      { value: 'SALIDAS', style: 1 },
      { value: 'MERMAS', style: 1 },
      { value: 'STOCK_FISICO_ACTUAL', style: 1 },
      { value: 'STOCK_COMPROMETIDO_FILA', style: 1 },
      { value: 'STOCK_DISPONIBLE_REAL_ATP', style: 1 },
      { value: 'STOCK_MINIMO_ALERTA', style: 1 },
      { value: 'ESTADO_OPERATIVO', style: 1 },
      { value: 'CANTIDAD_SUGERIDA_PEDIR', style: 1 },
    ],
    ...seed.products.map((p, idx) => {
      const r = idx + 2;
      return [
        { value: p.skuCode, formula: `'1_Catalogo_SKUs'!A${r}` },
        { value: p.name, formula: `'1_Catalogo_SKUs'!B${r}` },
        { value: p.packagingUnit, formula: `'1_Catalogo_SKUs'!D${r}` },
        { value: p.initialStock, formula: `'1_Catalogo_SKUs'!E${r}` },
        {
          value: p.totalEntries,
          formula: `SUMIFS('2_Registro_Kardex'!$D$2:$D$500,'2_Registro_Kardex'!$B$2:$B$500,A${r},'2_Registro_Kardex'!$C$2:$C$500,"ENTRADA")`,
        },
        {
          value: p.totalExits,
          formula: `SUMIFS('2_Registro_Kardex'!$D$2:$D$500,'2_Registro_Kardex'!$B$2:$B$500,A${r},'2_Registro_Kardex'!$C$2:$C$500,"SALIDA")`,
        },
        {
          value: p.totalShrinkage,
          formula: `SUMIFS('2_Registro_Kardex'!$D$2:$D$500,'2_Registro_Kardex'!$B$2:$B$500,A${r},'2_Registro_Kardex'!$C$2:$C$500,"AJUSTE_MERMA")`,
        },
        {
          value: p.physicalStock,
          formula: `D${r}+E${r}-F${r}-G${r}`,
        },
        {
          value: p.committedStock,
          formula: `SUMIFS('3_Ordenes_En_Fila'!$D$2:$D$200,'3_Ordenes_En_Fila'!$C$2:$C$200,A${r})`,
        },
        {
          value: p.availableStock,
          formula: `H${r}-I${r}`,
        },
        {
          value: p.minStockAlert,
          formula: `'1_Catalogo_SKUs'!F${r}`,
        },
        {
          value: p.status,
          formula: `IF(J${r}<0,"CRITICO_QUIEBRE_FILA",IF(J${r}<=K${r},"URGENTE_REORDEN","SALUDABLE"))`,
        },
        {
          value: p.suggestedOrderQty,
          formula: `IF(J${r}<=K${r},ROUNDUP(K${r}*1.2,0)-J${r},0)`,
        },
      ];
    }),
  ];

  const archiveFiles = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="1_Catalogo_SKUs" sheetId="1" r:id="rId1"/>
    <sheet name="2_Registro_Kardex" sheetId="2" r:id="rId2"/>
    <sheet name="3_Ordenes_En_Fila" sheetId="3" r:id="rId3"/>
    <sheet name="4_Tablero_ATP_Compras" sheetId="4" r:id="rId4"/>
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`,
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: buildWorksheetXml(sheet1Rows, [14, 52, 18, 18, 22, 22]),
    },
    {
      name: 'xl/worksheets/sheet2.xml',
      content: buildWorksheetXml(
        sheet2Rows,
        [20, 14, 20, 20, 22, 22],
        sheet2Validations,
      ),
    },
    {
      name: 'xl/worksheets/sheet3.xml',
      content: buildWorksheetXml(
        sheet3Rows,
        [16, 38, 14, 24, 18, 16],
        sheet3Validations,
      ),
    },
    {
      name: 'xl/worksheets/sheet4.xml',
      content: buildWorksheetXml(
        sheet4Rows,
        [14, 48, 18, 16, 14, 14, 14, 22, 24, 26, 22, 24, 24],
      ),
    },
  ];

  const xlsxBytes = buildZipArchive(archiveFiles);
  const outPath = path.join(currentDir, 'plantilla_maestra_contingencia.xlsx');
  fs.writeFileSync(outPath, xlsxBytes);
  console.log(`Plantilla Excel Maestra generada exitosamente: ${outPath} (${xlsxBytes.length} bytes)`);
}

generateExcelTemplate();
