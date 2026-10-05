import { CostaRicaFields } from '../components/CostaRicaFields';
import { useState } from 'react';
import { ArrowRight, Info, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const EMPTY_FORM = {
  name: '',
  email: '',
  role: 'Beneficiario',
  zone: '',
  identification: '',
  location: null,
  phone: '',
  notes: '',
  password: ''
};

const ROLE_OPTIONS = [
  'Beneficiario',
  'Donante individual',
  'Empresa donante',
  'Voluntario',
  'Aliado comunitario'
];


export function Register({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const account = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm(EMPTY_FORM);
      onLogin(account);
      navigate('/panel', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">AUTORREGISTRO</span>
        <h1>Registrate en CR Conecta</h1>
        <p>
          Creá tu cuenta para solicitar ayuda, seguir tus aportes o sumarte como voluntario. Al
          terminar entrás con tu sesión iniciada.
        </p>
      </div>

      <div className="register-layout">
        <form className="register-card" onSubmit={handleSubmit}>
          <div className="register-card-head">
            <span className="user-modal-mark" aria-hidden="true"><UserPlus size={18} /></span>
            <div>
              <h2>Tu cuenta</h2>
              <p>Los campos marcados con * son obligatorios.</p>
            </div>
          </div>

          <div className="user-modal-body">
            <CostaRicaFields value={form} onChange={patch => setForm(current => ({ ...current, ...patch }))} />
            <div>
              <label htmlFor="reg-name">Nombre completo *</label>
              <input
                id="reg-name"
                type="text"
                required
                maxLength={120}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="reg-email">Correo electrónico *</label>
              <input
                id="reg-email"
                type="email"
                required
                maxLength={160}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="nombre@correo.com"
              />
            </div>

            <div className="user-modal-grid">
              <div>
                <label htmlFor="reg-role">Rol *</label>
                <select
                  id="reg-role"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="user-modal-grid">
              <div>
                <label htmlFor="reg-phone">Teléfono de contacto</label>
                <input
                  id="reg-phone"
                  type="text"
                  maxLength={40}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+506 8888-0000"
                />
              </div>

              <div>
                <label htmlFor="reg-password">Contraseña *</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={200}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-notes">Notas del perfil</label>
              <textarea
                id="reg-notes"
                rows={2}
                maxLength={500}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="user-modal-note">
              <Info className="i i-l" size={14} />
              Tu contraseña se guarda cifrada con scrypt y nunca se muestra de nuevo. El rol
              Administrador no está disponible por autorregistro.
            </div>

            {error && <div className="user-modal-error" role="alert">{error}</div>}

            <div className="user-modal-actions">
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Creando cuenta…' : <>Crear mi cuenta<ArrowRight className="i i-r" size={14} /></>}
              </button>
            </div>
          </div>
        </form>

        <aside className="register-aside">
          <h3>Antes de registrarte</h3>
          <ul>
            <li>Tu cuenta queda disponible al instante para iniciar sesión.</li>
            <li>Podés seleccionar provincia, cantón y distrito de Costa Rica.</li>
            <li>Ningún autorregistro puede asumir el rol Administrador.</li>
            <li>Google/Gmail es una demostración. Los avisos de n8n requieren su configuración de correo.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}