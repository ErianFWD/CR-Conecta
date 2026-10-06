import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectionPdfInput } from '../../src/components/ProjectionPdfInput';
import { readProjectionPdf, downloadHistoryTemplate } from '../../src/lib/projectionPdf';
jest.mock('../../src/lib/projectionPdf', () => ({ readProjectionPdf: jest.fn(), downloadHistoryTemplate: jest.fn().mockResolvedValue() }));
test('imports and passes parsed PDF rows to the projection', async () => {
  const rows = [{ date: '2026-01-01', category: 'Vestimenta', quantity: 5 }];
  readProjectionPdf.mockResolvedValue(rows);
  const onChange = jest.fn();
  render(<ProjectionPdfInput value={null} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Seleccionar PDF'), { target: { files: [new File(['pdf'], 'historial.pdf', { type: 'application/pdf' })] } });
  await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ name: 'historial.pdf', rows }));
});
test('shows a read failure and clears the previous input', async () => {
  readProjectionPdf.mockRejectedValue(new Error('PDF inválido'));
  const onChange = jest.fn();
  render(<ProjectionPdfInput onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Seleccionar PDF'), { target: { files: [new File(['bad'], 'bad.pdf')] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('PDF inválido');
  expect(onChange).toHaveBeenCalledWith(null);
});
test('previews rows, removes the PDF and downloads the template', () => {
  const onChange = jest.fn();
  render(<ProjectionPdfInput value={{ name: 'historial.pdf', rows: [{ date: '2026-01-01', category: 'Vestimenta', quantity: 5 }] }} onChange={onChange} />);
  expect(screen.getByRole('status')).toHaveTextContent('1 registros');
  fireEvent.click(screen.getByText('Quitar PDF y usar la plataforma'));
  expect(onChange).toHaveBeenCalledWith(null);
  fireEvent.click(screen.getByText('Descargar plantilla PDF'));
  expect(downloadHistoryTemplate).toHaveBeenCalled();
});
