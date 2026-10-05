import { useCallback, useRef, useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useModalAccessibility } from '../lib/useModalAccessibility';

// Google 'G' official multi-color SVG icon
export function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}

const ROLE_BADGES = {
  'Administrador': { bg: 'var(--info-bg)', color: 'var(--info-fg)' },
  'Beneficiario': { bg: 'var(--ok-bg)', color: 'var(--ok-fg)' },
  'Donante individual': { bg: 'var(--warn-bg)', color: 'var(--warn-fg)' },
  'Empresa donante': { bg: 'var(--info-bg)', color: 'var(--accent-violet)' },
  'Voluntario': { bg: 'var(--info-bg)', color: 'var(--info-fg)' },
  'Aliado comunitario': { bg: 'var(--danger-bg)', color: 'var(--danger-fg)' }
};

function roleBadgeStyle(role) {
  const badge = ROLE_BADGES[role] || { bg: 'var(--tag-bg)', color: 'var(--tag-fg)' };
  return {
    fontSize: '0.6875rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '20px',
    background: badge.bg,
    color: badge.color,
    border: '1px solid currentColor'
  };
}

export function GoogleAccessModal({ isOpen, onClose, users = [], onSelectUser }) {
  const modalRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const handleClose = useCallback(() => {
    setSelectedUser(null);
    setPassword('');
    setError('');
    onClose();
  }, [onClose]);
  useModalAccessibility(modalRef, isOpen, handleClose);

  const handleLogin = async event => {
    event.preventDefault();
    if (!selectedUser || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const user = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser.id, password })
      });
      onSelectUser(user);
      handleClose();
      setPassword('');
      setSelectedUser(null);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ animation: 'fadeIn 0.2s ease' }}>
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-login-title"
        tabIndex={-1}
        className="google-modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          width: 'min(500px, 94vw)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(6,36,74,0.18)',
          border: '1px solid var(--line)',
          overflow: 'hidden'
        }}
      >
        {/* Google Header */}
        <div style={{ padding: '28px 28px 18px', textAlign: 'center', borderBottom: '1px solid var(--line-light)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-soft)', border: '1px solid var(--line-light)', marginBottom: 12 }}>
            <GoogleIcon size={24} />
          </div>
          <h2 id="demo-login-title" style={{ margin: '0 0 6px', fontSize: '1.25rem', color: 'var(--navy)', fontWeight: '700' }}>
            Acceso simulado con Google / Gmail
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Elegí una cuenta de demostración e ingresá su contraseña:
          </p>
        </div>

        {/* Disclaimer Warning according to RF-02 */}
        <div style={{ background: 'var(--surface-soft)', padding: '12px 24px', borderBottom: '1px solid var(--line-light)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Info size={15} style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', lineHeight: '1.45' }}>
            <strong>Aviso de demostración (RF-02):</strong> Este acceso asocia correos ficticios de <code>db.json</code>. Google/Gmail y flujos con n8n son simulados con fines académicos. En modo local, las cuentas comparten la contraseña de demostración indicada en el README.
          </p>
        </div>

        {/* List of demo Google accounts */}
        <div style={{ padding: '16px 20px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.map((u) => {
            const isSelected = selectedUser?.id === u.id;
            const avatarSrc = u.role === 'Empresa donante' ? '/logo.jpg' : '/logo-mark.png';

            return (
              <button
                key={u.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedUser(u);
                  setPassword('');
                  setError('');
                }}
                className="google-account-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                  ...(isSelected
                    ? {
                        border: '2px solid var(--accent-primary)',
                        background: 'var(--surface-soft)',
                        boxShadow: '0 0 0 3px rgba(6, 36, 74, 0.08)'
                      }
                    : {
                        border: '1px solid var(--line)',
                        background: 'var(--white)'
                      })
                }}
              >
                <img
                  src={avatarSrc}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid rgba(6, 36, 74, 0.08)'
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--navy)' }}>{u.name}</span>
                    <span style={roleBadgeStyle(u.role)}>{u.role}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {u.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1px' }}>
                    Zona: {u.zone} {u.phone ? `· ${u.phone}` : ''}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                    color: 'var(--info-fg)',
                    fontSize: '0.8125rem',
                    fontWeight: 700
                  }}
                >
                  {isSelected ? 'Ingresar' : 'Entrar'}
                  <ArrowRight className="i i-r" size={14} />
                </div>
              </button>
            );
          })}
        </div>

        {selectedUser && (
          <form onSubmit={handleLogin} style={{ padding: '4px 24px 18px', display: 'grid', gap: '10px' }}>
            <label htmlFor="demo-password" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Contraseña para {selectedUser.name}
            </label>
            <input
              id="demo-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--line)' }}
            />
            {error && <p role="alert" style={{ color: 'var(--danger)', margin: 0, fontSize: '0.75rem' }}>{error}</p>}
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'Verificando…' : 'Iniciar sesión'}<ArrowRight className="i i-r" size={14} />
            </button>
          </form>
        )}

        {/* Modal footer */}
        <div style={{ padding: '16px 24px', background: 'var(--surface-soft)', borderTop: '1px solid var(--line-light)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn secondary" 
            onClick={handleClose}
            style={{ padding: '10px 18px', fontSize: '0.78125rem' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
