import { useRef, useState } from 'react';
import { ArrowRight, Info, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useData } from '../lib/useData';
import { useModalAccessibility } from '../lib/useModalAccessibility';

export function SectionCreateModal({ isOpen, onClose, onCreated }) {
  const modalRef = useRef(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useModalAccessibility(modalRef, isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const created = await api('/sections', {
        method: 'POST',
        body: JSON.stringify({ title, body })
      });
      setTitle('');
      setBody('');
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo agregar la sección.');
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
        aria-labelledby="section-create-title"
        tabIndex={-1}
        className="user-modal-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="user-modal-header">
          <div>
            <span className="eyebrow">NUEVA SECCIÓN</span>
            <h3 id="section-create-title">Agregar sección al inicio</h3>
          </div>
          <span className="user-modal-mark" aria-hidden="true"><Plus size={18} /></span>
        </div>

        <form onSubmit={handleSubmit} className="user-modal-body">
          <div>
            <label htmlFor="section-title">Título *</label>
            <input
              id="section-title"
              type="text"
              required
              minLength={3}
              maxLength={90}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Noticias de la comunidad"
            />
          </div>

          <div>
            <label htmlFor="section-body">Contenido *</label>
            <textarea
              id="section-body"
              rows={5}
              required
              minLength={10}
              maxLength={1200}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Escribí el contenido que querés mostrar en la página de inicio."
            />
          </div>

          <div className="user-modal-note">
            <Info className="i i-l" size={14} />
            La sección queda visible para todas las personas que visiten el inicio.
          </div>

          {error && <div className="user-modal-error" role="alert">{error}</div>}

          <div className="user-modal-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Agregando…' : <>Agregar sección<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HomeSections({ session }) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { data: sections = [], state } = useData('/sections', refreshCount);

  if (state === 'loading') return null;

  const canRemove = section =>
    Boolean(session) && (session.role === 'Administrador' || section.authorId === session.id);

  const handleRemove = async section => {
    setError('');
    try {
      await api(`/sections/${section.id}`, { method: 'DELETE' });
      setRefreshCount(count => count + 1);
    } catch (err) {
      setError(err.message || 'No se pudo quitar la sección.');
    }
  };

  return (
    <section className="community-sections">
      <div className="section-container">
        <div className="section-intro">
          <div>
            <span className="eyebrow">COMUNIDAD</span>
            <h2>Secciones de la comunidad</h2>
            <p>Espacios publicados por las personas registradas en CR Conecta.</p>
          </div>

          {session && (
            <button type="button" className="btn primary" onClick={() => setCreating(true)}>
              <Plus className="i i-l" size={15} /> Agregar sección
            </button>
          )}
        </div>

        {error && <div className="api-banner" role="alert">{error}</div>}

        <div className="community-section-grid">
          {sections.map(section => (
            <article key={section.id} className="community-section-card">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              <footer>
                <span>{section.author} · {section.role}</span>
                {canRemove(section) && (
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => handleRemove(section)}
                    aria-label={`Quitar la sección ${section.title}`}
                  >
                    <Trash2 className="i i-l" size={14} /> Quitar
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>

        <SectionCreateModal
          isOpen={creating}
          onClose={() => setCreating(false)}
          onCreated={() => setRefreshCount(count => count + 1)}
        />
      </div>
    </section>
  );
}