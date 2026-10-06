import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectionResultModal } from '../../src/components/ProjectionResultModal';
import { trackingFixture } from '../fixtures';

test('shows a fulfilled goal with an SVG check and dismisses on acknowledgement', () => {
  const close = jest.fn();
  render(<ProjectionResultModal record={trackingFixture} onClose={close} />);
  const dialog = screen.getByRole('dialog', { name: '¡Se cumplió la meta!' });
  expect(dialog).toHaveClass('projection-success');
  expect(dialog.querySelector('svg')).toBeInTheDocument();
  expect(screen.getByText(/31 de 30/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
  expect(close).toHaveBeenCalledTimes(1);
});
test('shows a failed goal with red styling and accessible text', () => {
  render(<ProjectionResultModal record={{ ...trackingFixture, status: 'fallida', actual: 10 }} onClose={jest.fn()} />);
  expect(screen.getByRole('dialog', { name: 'No se cumplió la meta' })).toHaveClass('projection-failure');
  expect(screen.getByText(/Terminó el plazo/)).toBeInTheDocument();
});
test('does not render a dialog without a result', () => {
  render(<ProjectionResultModal record={null} onClose={jest.fn()} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
test('retains error and disables acknowledgement during persistence', () => {
  render(<ProjectionResultModal record={trackingFixture} onClose={jest.fn()} busy error="Sin conexión" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión');
  expect(screen.getByRole('button')).toBeDisabled();
});
