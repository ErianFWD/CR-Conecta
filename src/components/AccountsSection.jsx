import { useState } from 'react';
import { CircleCheck, UserPlus } from 'lucide-react';
import { useData } from '../lib/useData';
import { UserCreateModal } from './UserCreateModal';
import { RoleAvatar, roleIcons } from './ShellParts';

const ROLE_CLASS = {
  'Administrador': 'role-admin',
  'Beneficiario': 'role-beneficiario',
  'Donante individual': 'role-donante',
  'Empresa donante': 'role-empresa',
  'Voluntario': 'role-voluntario',
  'Aliado comunitario': 'role-aliado'
};

export function AccountsSection({ sessionRole = 'Beneficiario' }) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const { data: users = [], state } = useData('/users', refreshCount);

  const handleCreated = created => {
    setNotice(`Cuenta ${created.name} registrada como ${created.role}. Ya puede iniciar sesión.`);
    setRefreshCount(count => count + 1);
  };

  return (
    <div className="accounts-section">
      <div className="accounts-toolbar">
        <div>
          <strong>Cuentas registradas</strong>
          <p>{users.length} {users.length === 1 ? 'perfil activo' : 'perfiles activos'} en el sistema.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setCreating(true)}>
          <UserPlus className="i i-l" size={15} /> Registrar nuevo usuario
        </button>
      </div>

      {notice && <div role="status" className="accounts-notice"><CircleCheck className="i i-l" size={15} />{notice}</div>}
      {state === 'error' && (
        <div className="api-banner" role="alert">
          No se pudieron cargar las cuentas desde la API local.
          <button type="button" onClick={() => setRefreshCount(count => count + 1)}>Reintentar</button>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Perfil</th>
              <th>Rol</th>
              <th>Zona</th>
              <th>Contacto</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: '800', color: 'var(--navy)' }}>{user.id}</td>
                <td>
                  <span className="accounts-identity">
                    <RoleAvatar src={roleIcons[user.role] || '/logo-mark.png'} alt={user.role} size={30} />
                    <span>
                      <b>{user.name}</b>
                      <small>{user.email}</small>
                    </span>
                  </span>
                </td>
                <td>
                  <span className={`accounts-role ${ROLE_CLASS[user.role] || 'role-default'}`}>{user.role}</span>
                </td>
                <td>{user.zone}</td>
                <td>{user.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserCreateModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        onCreated={handleCreated}
        sessionRole={sessionRole}
      />
    </div>
  );
}