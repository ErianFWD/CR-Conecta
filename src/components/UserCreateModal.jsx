import { CostaRicaFields } from '../components/CostaRicaFields';
import { useRef, useState } from 'react';
import { ArrowRight, Info, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { useModalAccessibility } from '../lib/useModalAccessibility';

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

const FIELD_LABELS = {
  name: 'Nombre completo *',
  email: 'Correo electrónico *',
  role: 'Rol *',
  zone: 'Zona general *',
  phone: 'Teléfono de contacto',
  notes: 'Notas del perfil',
  password: 'Contraseña *'
};

const SELECTABLE_ROLES = [
  'Beneficiario',
  'Donante individual',
  'Empresa donante',
  'Voluntario',
  'Aliado comunitario'
];

export function UserCreateModal({ isOpen, onClose, onCreated, sessionRole = 'Beneficiario' }) {
  const modalRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useModalAccessibility(modalRef, isOpen, onClose);

  const isAdmin = sessionRole === 'Administrador';
  const roles = isAdmin ? ['Beneficiario', ...SELECTABLE_ROLES.slice(1), 'Administrador'] : SELECTABLE_ROLES;
  const roleError = error.startsWith('Solo el administrador')
    ? 'Ese rol está reservado al administrador. Elegí otro rol para la cuenta.'
    : error;

  if (!isOpen) return null;

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const created = await api('/users', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm(EMPTY_FORM);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la cuenta en la API local.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-create-title"
        tabIndex={-1}
        className="user-modal-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="user-modal-header">
          <div>
            <span className="eyebrow">ALTA DE CUENTA</span>
            <h3 id="user-create-title">Registrar nuevo usuario</h3>
          </div>
          <span className="user-modal-mark" aria-hidden="true"><UserPlus size={18} /></span>
        </div>

        <form onSubmit={handleSubmit} className="user-modal-body">
          <CostaRicaFields value={form} onChange={patch => setForm(current => ({ ...current, ...patch }))} />
          <div>
            <label htmlFor="user-name">{FIELD_LABELS.name}</label>
            <input
              id="user-name"
              type="text"
              required
              maxLength={120}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="user-email">{FIELD_LABELS.email}</label>
            <input
              id="user-email"
              type="email"
              required
              maxLength={160}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="nombre@crconecta.demo"
            />
          </div>

          <div className="user-modal-grid">
            <div>
              <label htmlFor="user-role">{FIELD_LABELS.role}</label>
              <select
                id="user-role"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="user-modal-grid">
            <div>
              <label htmlFor="user-phone">{FIELD_LABELS.phone}</label>
              <input
                id="user-phone"
                type="text"
                maxLength={40}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+506 8888-0000"
              />
            </div>

            <div>
              <label htmlFor="user-password">{FIELD_LABELS.password}</label>
              <input
                id="user-password"
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
            <label htmlFor="user-notes">{FIELD_LABELS.notes}</label>
            <textarea
              id="user-notes"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="user-modal-note">
            <Info className="i i-l" size={14} />
            La contraseña se guarda cifrada con scrypt en el servidor. La cuenta queda disponible
            para iniciar sesión en la pantalla de acceso.
            {!isAdmin && ' El rol Administrador solo puede asignarlo un administrador.'}
          </div>

          {roleError && <div className="user-modal-error" role="alert">{roleError}</div>}

          <div className="user-modal-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Registrando…' : <>Registrar usuario<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}