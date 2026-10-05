import { useState } from 'react';
import { ArrowRightLeft, Pencil } from 'lucide-react';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { DisplayPreferencesControls } from '../components/DisplayPreferencesControls';
import { RoleAvatar, roleIcons } from '../components/ShellParts';

export function Profile({ session, onUpdateSession, onLogout, onOpenGoogleAuth }) {
  const [editing, setEditing] = useState(false);

  if (!session) {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">PERFIL</span>
          <h1>Sin sesión activa</h1>
          <p>Iniciá sesión con una cuenta de prueba para ver el perfil.</p>
        </div>
        <button className="btn primary" onClick={onOpenGoogleAuth}>Entrar con Google / Demo</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">PERFIL DE DEMOSTRACIÓN (RF-04)</span>
        <h1>{session.name}</h1>
        <p>Datos no sensibles y ficticios. Podés editar tu información y guardarla en <code>db.json</code>.</p>
      </div>

      <div
        style={{
          background: 'var(--white)',
          borderRadius: '20px',
          border: '1px solid var(--line)',
          padding: '30px',
          maxWidth: '680px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
          <RoleAvatar src={roleIcons[session.role] || '/logo-mark.png'} alt={session.role} size={68} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.375rem', color: 'var(--navy)' }}>{session.name}</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
              <span style={{ background: 'var(--info-bg)', color: 'var(--info-fg)', padding: '3px 10px', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '700' }}>
                Rol: {session.role}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Zona: {session.zone}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', padding: '18px', borderRadius: '12px', border: '1px solid var(--line-light)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
          <div><strong>Correo ficticio:</strong> {session.email}</div>
          <div><strong>Teléfono:</strong> {session.phone || '+506 8888-0000'}</div>
          <div><strong>Zona comunitaria:</strong> {session.zone}</div>
          {session.notes && <div><strong>Notas del perfil:</strong> {session.notes}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => setEditing(true)}>
              Editar mis datos (RF-04)<Pencil className="i i-r" size={14} />
            </button>
            <button className="btn secondary" onClick={onOpenGoogleAuth}>
              Cambiar cuenta<ArrowRightLeft className="i i-r" size={14} />
            </button>
          </div>
          <button className="btn secondary" onClick={onLogout} style={{ color: 'var(--danger)' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <section
        className="profile-preferences-card"
        aria-labelledby="profile-preferences-title"
      >
        <span className="eyebrow">ACCESIBILIDAD</span>
        <h2 id="profile-preferences-title">Preferencias de visualización</h2>
        <p className="profile-preferences-note">
          Se guardan en este navegador y se aplican a todo el sitio de inmediato.
        </p>
        <DisplayPreferencesControls />
      </section>

      {editing && (
        <ProfileEditModal
          isOpen={editing}
          onClose={() => setEditing(false)}
          user={session}
          onSaved={(updated) => {
            onUpdateSession(updated);
          }}
        />
      )}
    </div>
  );
}
