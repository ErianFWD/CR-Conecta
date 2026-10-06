import { render, screen, within } from '@testing-library/react';
import { Package } from 'lucide-react';
import { DashboardBarChart, DashboardMetric, dashboardCounts } from '../../src/components/DashboardCharts';

test('renders a metric with independent value, label and detail that can wrap', () => {
  const { container } = render(<DashboardMetric icon={Package} label="Total registradas" value={8} detail="Todas las solicitudes" />);
  const content = container.querySelector('.dashboard-metric-content');
  expect(within(content).getByText('8')).toBeInTheDocument();
  expect(within(content).getByText('Total registradas')).toBeInTheDocument();
  expect(within(content).getByText('Todas las solicitudes')).toBeInTheDocument();
  expect(content.querySelector('.dashboard-metric-label')).not.toHaveAttribute('title');
});

test('bar chart shows accessible exact counts, percentages and a scale for a long category', () => {
  render(<DashboardBarChart title="Donaciones por categoría" subtitle="Aportes" items={[{ label: 'Electrodomésticos y mobiliario para toda la comunidad', value: 3 }, { label: 'Vestimenta', value: 1 }]} />);
  expect(screen.getByRole('listitem', { name: /Electrodomésticos y mobiliario.*3 registros, 75 por ciento/i })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: /Vestimenta: 1 registros, 25 por ciento/i })).toBeInTheDocument();
  expect(screen.getByText('4', { selector: '.dashboard-chart-total strong' })).toBeInTheDocument();
});

test('column chart marks zero without inventing bars and keeps long labels visible', () => {
  const { container } = render(<DashboardBarChart title="Inventario" subtitle="Estado" variant="columns" items={[{ label: 'Bajo mínimo', value: 0 }, { label: 'Nivel de existencias disponibles', value: 4 }]} />);
  expect(screen.getByText('Nivel de existencias disponibles')).toBeInTheDocument();
  expect(container.querySelector('.dashboard-column-track > span').style.height).toBe('0%');
});

test('empty chart and grouping keep readable, stable categories', () => {
  render(<DashboardBarChart title="Aportes" subtitle="Resumen" items={[]} />);
  expect(screen.getByText('Aún no hay datos para mostrar.')).toBeInTheDocument();
  expect(dashboardCounts([{ category: 'Alimentos' }, { category: 'Alimentos' }, { category: 'Vestimenta' }], item => item.category))
    .toEqual([{ label: 'Alimentos', value: 2 }, { label: 'Vestimenta', value: 1 }]);
});
