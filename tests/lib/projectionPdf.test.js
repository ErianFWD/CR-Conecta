/** @jest-environment node */
import { parseHistoryLines, readProjectionPdf, buildProjectionPdf } from '../../src/lib/projectionPdf';
import { projectionFixture } from '../fixtures';
test('parses text rows with accent marks and decimal commas', () => {
  expect(parseHistoryLines(['Historial', '2026-01-01 | Electrodomésticos | 2,5'])).toEqual([{ date: '2026-01-01', category: 'Electrodomésticos', quantity: 2.5 }]);
});
test.each([
  ['2026-02-30 | Ropa | 5'], ['2026-01-01 | Ropa | 0'], ['2026-01-01 | Ropa | -5'], ['2099-01-01 | Ropa | 2'], ['2026-01-01 | Ropa |'], ['sin texto']
])('rejects invalid data: %s', line => { expect(() => parseHistoryLines([line])).toThrow(); });
test('rejects file types, oversized PDFs and spoofed content before parsing', async () => {
  await expect(readProjectionPdf({ name: 'x.txt' })).rejects.toThrow('PDF');
  await expect(readProjectionPdf({ name: 'x.pdf', size: 11000000 })).rejects.toThrow('10 MB');
  await expect(readProjectionPdf({ name: 'x.pdf', size: 3, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer })).rejects.toThrow('válido');
});
test('generates a real multi-page PDF with the report content and weekly table', async () => {
  const doc = await buildProjectionPdf(projectionFixture());
  const bytes = doc.output('arraybuffer');
  expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-');
  expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  expect(Buffer.from(bytes).toString('latin1')).toContain('Alimentos sellados');
});
