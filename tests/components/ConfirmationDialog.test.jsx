import { render, screen, act, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { requestConfirmation } from '../../src/services/confirmation';
test.each([['Aceptar', true], ['Cancelar', false]])('resolves confirmation through %s', async (button, answer) => {
  render(<ConfirmationDialog />);
  let decision;
  act(() => { decision = requestConfirmation({ title: 'Cerrar sesión', text: '¿Querés cerrar tu sesión?' }); });
  expect(screen.getByRole('dialog')).toHaveTextContent('Cerrar sesión');
  fireEvent.click(screen.getByText(button));
  await expect(decision).resolves.toBe(answer);
});
