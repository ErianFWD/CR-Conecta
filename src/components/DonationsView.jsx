import { requestConfirmation } from '../services/confirmation';
import { useRef, useState } from 'react';
import { FileText, Lock, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useModalAccessibility } from '../lib/useModalAccessibility';

export function DonationsView({ data = [] }) {
  const [qrModal, setQrModal] = useState(null);
  const qrModalRef = useRef(null);
  useModalAccessibility(qrModalRef, Boolean(qrModal), () => setQrModal(null));

  const generateQR = async (d) => {
    const url = await QRCode.toDataURL(`http://localhost:5174/donacion/${d.id}`);
    setQrModal({ donation: d, qrUrl: url });
  };

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto & Donante</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>QR Local</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: '800' }}>#{d.id}</td>
                <td>
                  {d.photo && <img className="donation-photo-thumbnail" src={d.photo} alt={`Producto donado: ${d.product}`} loading="lazy" />}
                  <b>{d.product}</b>
                  <small>{d.anonymous ? <><Lock className="i i-l" size={12} />Anónimo (Protegido)</> : `Donante: ${d.donorType}`}</small>
                </td>
                <td>{d.category}</td>
                <td>{d.quantity}</td>
                <td>{d.destination}</td>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'var(--info-bg)', color: 'var(--info-fg)', fontSize: '0.75rem', fontWeight: '700' }}>
                    {d.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => generateQR(d)}
                    style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', marginRight: '4px' }}
                  >
                    QR<QrCode className="i i-r" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestConfirmation({ title: 'Acción de demostración', text: 'Simulando generación de certificado PDF y subida a n8n... (RF-30)\n\nCertificado generado para la donación #' + d.id })}
                    style={{ background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    PDF (RF-30)<FileText className="i i-r" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrModal && (
        <div className="modal-backdrop" onClick={() => setQrModal(null)}>
          <div className="modal" ref={qrModalRef} role="dialog" aria-modal="true" aria-labelledby="qr-title" tabIndex={-1} onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <span className="eyebrow">CONSULTA LOCAL SIMULADA</span>
            <h3 id="qr-title" style={{ margin: '8px 0 4px' }}>Comprobante #{qrModal.donation.id}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: 'var(--muted)' }}>
              Código QR de demostración para verificar el aporte en centros comunitarios.
            </p>
            <img src={qrModal.qrUrl} alt="QR de donación" style={{ width: '160px', height: '160px', border: '1px solid var(--line)', borderRadius: '12px', padding: '8px' }} />
            <div style={{ marginTop: '20px' }}>
              <button className="btn secondary" onClick={() => setQrModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
