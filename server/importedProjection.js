export function validateImportedHistory(value, today = new Date()) {
  if (value === undefined || value === null) return null;
  const fail = () => { const error = new Error('El PDF debe contener de 1 a 2000 filas válidas: fecha YYYY-MM-DD, categoría y cantidad positiva.'); error.status = 400; throw error; };
  if (!Array.isArray(value) || !value.length || value.length > 2000) fail();
  return value.map((row, index) => {
    if (!row || typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)
      || !Number.isFinite(Date.parse(row.date)) || new Date(row.date).toISOString().slice(0, 10) !== row.date
      || row.date > today.toISOString().slice(0, 10) || typeof row.category !== 'string'
      || !row.category.trim() || row.category.length > 80 || !Number.isFinite(row.quantity)
      || row.quantity <= 0 || row.quantity > 1000000000) fail();
    return { id: `pdf-${index}`, date: row.date, category: row.category.trim(), quantity: row.quantity, status: 'Registrada' };
  });
}
