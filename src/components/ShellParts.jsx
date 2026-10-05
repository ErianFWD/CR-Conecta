import { useRef } from 'react';
import { useModalAccessibility } from '../lib/useModalAccessibility';

export const roleIcons = {
  'Administrador': '/logo-mark.png',
  'Beneficiario': '/logo-mark.png',
  'Donante individual': '/logo-mark.png',
  'Empresa donante': '/logo.jpg',
  'Voluntario': '/logo-mark.png',
  'Aliado comunitario': '/logo.jpg'
};

export function RoleAvatar({ src, alt, size = 42 }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '12px',
        display: 'block',
        border: '1px solid rgba(6, 36, 74, 0.08)',
        background: '#fff'
      }}
    />
  );
}

export function Confirm({ title, text, error, onConfirm, onCancel }) {
  const modalRef = useRef(null);
  useModalAccessibility(modalRef, true, onCancel);
  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" tabIndex={-1}>
        <div className="modal-mark">!</div>
        <h3 id="confirm-title">{title}</h3>
        <p>{text}</p>
        {error && <p role="alert" style={{ color: 'var(--danger-fg)' }}>{error}</p>}
        <div className="modal-actions">
          <button className="btn secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn primary" onClick={onConfirm}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
