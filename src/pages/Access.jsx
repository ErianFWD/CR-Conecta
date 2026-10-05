import { ArrowRight, Info, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../lib/useData';
import { GoogleIcon } from '../components/GoogleAccessModal';
import { RoleAvatar, roleIcons } from '../components/ShellParts';

export function Access({ onOpenGoogleAuth }) {
  const { data: users = [], state } = useData('/auth/demo-users');

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">ACCESO Y PERFILES DE DEMOSTRACIÓN</span>
        <h1>Entrá a CR Conecta</h1>
        <p>
          Accedé mediante la simulación visual de Google/Gmail o seleccioná una cuenta precargada de prueba.
        </p>
      </div>

      {/* Prominent Google Access Card (RF-02) */}
      <div 
        style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: '18px',
          padding: '28px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GoogleIcon size={24} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--navy)' }}>
              Acceso visual tipo Google / Gmail (RF-02)
            </h3>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--muted)', maxWidth: '580px' }}>
            Simula la experiencia de autenticación de un clic vinculando un correo ficticio de <code>db.json</code> con su respectivo perfil y rol.
          </p>
        </div>

<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn primary"
            onClick={onOpenGoogleAuth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              fontSize: '0.84375rem',
              fontWeight: '700'
            }}
          >
            <GoogleIcon size={18} />
            Continuar con Google<ArrowRight className="i i-r" size={14} />
          </button>

          <Link
            to="/registro"
            className="btn secondary"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 20px', fontSize: '0.8125rem' }}
          >
            <UserPlus className="i i-l" size={15} />
            No tengo cuenta, registrarme
          </Link>
        </div>
      </div>

      {/* Disclaimer Notice */}
      <div 
        style={{
          background: 'var(--surface-soft)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '28px',
          fontSize: '0.75rem',
          color: 'var(--muted)'
        }}
      >
        <Info size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Aviso institucional:</strong> Google, Gmail y los flujos con n8n no autentican realmente; no representan servicios ni entregas reales. Todas las operaciones usan datos ficticios almacenados en <code>db.json</code>.
        </div>
      </div>

      {/* Grid of All Preloaded Accounts */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1.0625rem', color: 'var(--navy)' }}>
        O elegí directamente una cuenta de demostración por rol (RF-01):
      </h3>

      <div className="access-grid">
        {state === 'loading' ? (
          <div className="state"><div className="state-icon">…</div><h3>Cargando cuentas...</h3></div>
        ) : (
          (users || []).map(u => (
            <button
              key={u.id}
              className="account-card"
              onClick={onOpenGoogleAuth}
            >
              <div className="avatar">
                <RoleAvatar src={roleIcons[u.role] || '/logo-mark.png'} alt={u.role} size={40} />
              </div>
              <div>
                <b>{u.name}</b>
                <small>{u.role}</small>
                <span>{u.email} · Zona: {u.zone}</span>
              </div>
              <strong>Entrar<ArrowRight className="i i-r" size={14} /></strong>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
