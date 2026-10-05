import 'dotenv/config';
import { readFile } from 'node:fs/promises';

try {
  const event = JSON.parse(await readFile(new URL('../n8n/EVENTO-DE-PRUEBA.json', import.meta.url), 'utf8'));
  const url = process.env.N8N_DONATION_WEBHOOK_URL;
  const token = process.env.N8N_WEBHOOK_TOKEN;
  if (!url || !token) throw new Error('Configurá N8N_DONATION_WEBHOOK_URL y N8N_WEBHOOK_TOKEN en .env.');
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(event.data?.recipient?.email || '')) throw new Error('Poné tu correo en recipient.email de n8n/EVENTO-DE-PRUEBA.json.');
  if (event.eventId !== `donation.registered:${event.data?.id}`) throw new Error('eventId debe ser donation.registered: seguido del mismo data.id.');
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CR-Conecta-Token': token },
    body: JSON.stringify(event), signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`Webhook respondió HTTP ${response.status}. Verificá credencial, URL y que esté escuchando o activo.`);
  console.log('Webhook aceptó el evento. Revisá Sheets y los buzones para confirmar los envíos.');
} catch (error) {
  console.error(error.name === 'TimeoutError' || error.message === 'fetch failed'
    ? 'No se pudo conectar al Webhook. Revisá que n8n esté iniciado y escuchando.' : error.message);
  process.exitCode = 1;
}
