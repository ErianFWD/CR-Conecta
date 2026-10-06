// The worker is bundled locally by Vite; no external CDN receives the document.
export async function readProjectionPdf(file) {
  if (!file || !/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) throw new Error('Seleccioná un archivo PDF.');
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('El PDF debe pesar como máximo 10 MB y no estar vacío.');
  const data = new Uint8Array(await file.arrayBuffer());
  if (String.fromCharCode(...data.slice(0, 5)) !== '%PDF-') throw new Error('El archivo no es un PDF válido.');
  const pdfjs = await import('pdfjs-dist');
  const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const task = pdfjs.getDocument({ data, isEvalSupported: false });
  try {
    const document = await task.promise;
    return await extractHistoryFromDocument(document);
  } catch (error) {
    if (error.name === 'PasswordException') throw new Error('El PDF tiene contraseña. Subí una copia sin protección.', { cause: error });
    throw error;
  } finally { await task.destroy(); }
}

export async function extractHistoryFromDocument(document) {
    if (document.numPages > 30) throw new Error('Usá un PDF de hasta 30 páginas.');
    const lines = [];
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const content = await page.getTextContent();
      let line = '', lastY = null;
      for (const item of content.items) {
        if (typeof item.str !== 'string') continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(lastY - y) > 3) { lines.push(line); line = ''; }
        line += `${item.str} `;
        lastY = y;
        if (item.hasEOL) { lines.push(line); line = ''; lastY = null; }
      }
      if (line) lines.push(line);
      page.cleanup();
    }
    return parseHistoryLines(lines);
}

export function parseHistoryLines(lines) {
  const rows = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const line of lines) {
    const text = line.trim();
    if (!/^\d{4}-\d{2}-\d{2}/.test(text)) continue;
    const match = text.match(/^(\d{4}-\d{2}-\d{2})\s*[|;]\s*([^|;]+?)\s*[|;]\s*(\d+(?:[.,]\d+)?)\s*$/);
    if (!match) throw new Error('Una fila está incompleta. Usá: YYYY-MM-DD | Categoría | Cantidad.');
    const [, date, category, quantityText] = match;
    const quantity = Number(quantityText.replace(',', '.'));
    if (!Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > today
      || !category.trim() || category.trim().length > 80 || quantity <= 0 || quantity > 1e9) throw new Error('Revisá las fechas (sin fechas futuras), categorías y cantidades positivas del PDF.');
    rows.push({ date, category: category.trim(), quantity });
  }
  if (!rows.length) throw new Error('No encontré filas de historial. Usá la plantilla PDF con texto seleccionable; las imágenes escaneadas requieren convertirlas a texto.');
  if (rows.length > 2000) throw new Error('El PDF admite hasta 2000 filas de historial.');
  return rows;
}

async function pdfDocument() {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

export async function buildProjectionPdf(projection, tracking) {
  const doc = await pdfDocument();
  let y = 20;
  const write = (text, size = 11) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(text), 174);
    for (const line of lines) {
      if (y > 278) { doc.addPage(); y = 20; }
      doc.text(line, 18, y); y += size * 0.47 + 2;
    }
    y += 2;
  };
  doc.setTextColor(22, 63, 101);
  write('CR CONECTA | Proyección de campaña', 18);
  doc.setTextColor(30, 40, 50);
  write(`Categoría: ${projection.scenario.category}`);
  write(`Meta: ${projection.scenario.goal} unidades | Plazo: ${projection.scenario.weeks} semanas`);
  write(`Generado: ${new Date(projection.generatedAt).toLocaleString('es-CR')}`);
  write(`Fuente: ${projection.dataSource === 'pdf' ? 'Historial importado desde PDF' : 'Datos de la plataforma'} | Interpretación: ${projection.narrative.source === 'ia' ? 'IA' : 'Automática'}`);
  write(`Confianza: ${projection.confidence.level}. ${projection.confidence.reasons.join(' ')}`);
  write(`Proyección base: ${projection.forecast.totals.base} | Rango: ${projection.forecast.totals.low} - ${projection.forecast.totals.high}`);
  if (tracking) write(`Seguimiento: ${tracking.status} | Real: ${tracking.actual} / ${tracking.scenario.goal} | Cierre: ${new Date(tracking.endsAt).toLocaleString('es-CR')}`);
  write(projection.narrative.summary);
  for (const recommendation of projection.narrative.recommendations) write(`- ${recommendation}`);
  if (y > 180) { doc.addPage(); y = 20; }
  write('Gráfico acumulado: azul = estimado; rojo = meta', 12);
  const top = y, chartHeight = 55, x = 22, width = 165;
  const max = Math.max(1, projection.scenario.goal, ...projection.forecast.weeks.map(row => row.cumulativeHigh));
  const sy = n => top + chartHeight - n / max * chartHeight;
  doc.setDrawColor(190); doc.line(x, top, x, top + chartHeight); doc.line(x, top + chartHeight, x + width, top + chartHeight);
  doc.setDrawColor(185, 28, 28); doc.line(x, sy(projection.scenario.goal), x + width, sy(projection.scenario.goal));
  doc.setDrawColor(30, 100, 180); doc.setLineWidth(0.8);
  let previous = [x, sy(0)];
  projection.forecast.weeks.forEach((row, i, rows) => {
    const point = [x + (i + 1) / rows.length * width, sy(row.cumulativeBase)];
    doc.line(...previous, ...point); previous = point;
  });
  y = top + chartHeight + 10;
  write('Semana | Base | Mínimo | Máximo | Acumulado', 12);
  projection.forecast.weeks.forEach(row => write(`${row.week} | ${row.base} | ${row.low} | ${row.high} | ${row.cumulativeBase}`));
  write('Supuestos y límites', 13);
  projection.assumptions.forEach(item => write(`- ${item}`));
  write('Estimación orientativa: no garantiza resultados. El seguimiento usa nuevas donaciones registradas durante el plazo; un PDF importado no registra donaciones.');
  // Historical units only, never forecast values. This section can be reused as input.
  write('Historial utilizado (fecha de inicio de semana | categoría | unidades)', 12);
  projection.history.filter(row => row.units > 0).forEach(row => write(`${row.start} | ${projection.scenario.category} | ${row.units}`));
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i); doc.setFontSize(9); doc.text(`CR Conecta - ${i} / ${doc.getNumberOfPages()}`, 18, 290);
  }
  return doc;
}

export async function downloadProjectionPdf(projection, tracking) {
  const doc = await buildProjectionPdf(projection, tracking);
  doc.save(`CR-Conecta-proyeccion-${projection.generatedAt.slice(0, 10)}.pdf`);
}

export async function downloadHistoryTemplate() {
  const doc = await pdfDocument();
  doc.setFontSize(17); doc.text('CR Conecta - Historial para proyecciones', 18, 22);
  doc.setFontSize(11);
  const date = weeksAgo => new Date(Date.now() - weeksAgo * 7 * 86400000).toISOString().slice(0, 10);
  [
    'Prepará tu documento con una fila por registro y exportalo como PDF.',
    'Usá texto seleccionable, fechas reales pasadas y cantidades positivas.',
    'Formato: YYYY-MM-DD | Categoría | Cantidad',
    'Estas filas son ejemplos: reemplazalas por tus datos antes de importar.',
    '',
    `${date(4)} | Alimentos sellados | 20`,
    `${date(3)} | Alimentos sellados | 25`,
    `${date(2)} | Alimentos sellados | 18`,
    `${date(1)} | Vestimenta | 12`,
    '',
    'Límites: 10 MB, 30 páginas y 2000 registros.',
    'El PDF sustituye el historial del cálculo; no crea donaciones reales.'
  ].forEach((line, i) => doc.text(line, 18, 38 + i * 8));
  doc.save('CR-Conecta-plantilla-historial.pdf');
}
