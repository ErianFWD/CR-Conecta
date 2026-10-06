import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectionNotifications } from '../../src/components/ProjectionNotifications';
import { api } from '../../src/lib/api';
import { trackingFixture } from '../fixtures';
jest.mock('../../src/lib/api', () => ({ api: jest.fn() }));
test('notifies an admin and persists acknowledgement', async () => {
  let acknowledged = false;
  api.mockImplementation((path) => {
    if (path.includes('acknowledge')) { acknowledged = true; return Promise.resolve({}); }
    return Promise.resolve([{ ...trackingFixture, acknowledgedStatus: acknowledged ? 'cumplida' : null }]);
  });
  render(<ProjectionNotifications session={{ id: 'a', role: 'Administrador' }} />);
  expect(await screen.findByRole('dialog')).toHaveTextContent('¡Se cumplió la meta!');
  fireEvent.click(screen.getByText('Entendido'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(api).toHaveBeenCalledWith('/projections/p1/acknowledge', { method: 'POST' });
});
test('does not notify when a target is still in progress or already acknowledged', async () => {
  api.mockResolvedValue([{ ...trackingFixture, status: 'en_curso' }, { ...trackingFixture, acknowledgedStatus: 'cumplida' }]);
  render(<ProjectionNotifications session={{ id: 'a', role: 'Administrador' }} />);
  await waitFor(() => expect(api).toHaveBeenCalled());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
test('does not request private targets for an individual donor', () => {
  render(<ProjectionNotifications session={{ id: 'd', role: 'Donante individual' }} />);
  expect(api).not.toHaveBeenCalled();
});
