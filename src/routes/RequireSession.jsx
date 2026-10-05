import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleIcon } from '../components/GoogleAccessModal';

export function RequireSession({ session, onOpenGoogleAuth, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!session) {
      navigate(`/acceso?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [session, navigate, location.pathname]);

  if (session) return children;

  return (
    <div className="page" aria-live="polite">
      <div className="page-head">
        <span className="eyebrow">RUTA PRIVADA</span>
        <h1>Necesitás iniciar sesión</h1>
        <p>Esta pantalla solo está disponible para cuentas con sesión activa.</p>
      </div>
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--white)',
          borderRadius: '18px',
          border: '1px solid var(--line)'
        }}
      >
        <h3 style={{ marginBottom: '12px', color: 'var(--navy)' }}>
          Ingresá con una cuenta para ver su panel
        </h3>
        <button className="btn primary" onClick={onOpenGoogleAuth} style={{ display: 'inline-flex', gap: '8px' }}>
          <GoogleIcon size={18} /> Iniciar sesión de demostración
        </button>
      </div>
    </div>
  );
}