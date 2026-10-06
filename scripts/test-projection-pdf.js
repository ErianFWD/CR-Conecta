// Real PDF export/import round trip using the same extraction code as the UI.
import assert from 'node:assert/strict';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { buildProjectionPdf, extractHistoryFromDocument } from '../src/lib/projectionPdf.js';
import { projectCampaign } from '../server/projection.js';

const today = new Date();
const category = 'Alimentos sellados';
const projection = await projectCampaign({
  input: { category, goal: 30, weeks: 52, useAI: false },
  donations: [{ category, date: today.toISOString().slice(0, 10), quantity: 20 }]
});
const output = await buildProjectionPdf(projection);
const task = getDocument({ data: new Uint8Array(output.output('arraybuffer')), useSystemFonts: true });
try {
  const pdf = await task.promise;
  const rows = await extractHistoryFromDocument(pdf);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 20);
  assert.equal(rows[0].category, category);
  assert.ok(pdf.numPages >= 3);
  const reimported = await projectCampaign({ input: { category, goal: 30, weeks: 6, useAI: false, importedHistory: rows } });
  assert.equal(reimported.dataSource, 'pdf');
  assert.equal(reimported.importedRows, 1);
  console.log(`PDF verificado: ${pdf.numPages} páginas; gráfico, tabla y recuperación de ${rows[0].quantity} unidades; proyección desde PDF correcta.`);
} finally { await task.destroy(); }
