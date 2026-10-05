import { CostaRicaFields } from './CostaRicaFields';
import { requestConfirmation } from '../services/confirmation';
import { useState } from 'react';
import { ArrowRight, Check, Handshake, MapPin } from 'lucide-react';

// Modern, lightweight vector emblems for sponsors and allies
export function SponsorIcon({ type = 'corporate', size = 32 }) {
  if (type === 'corporate') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" color="var(--navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M12 3l9 4H3l9-4z" />
      </svg>
    );
  }
  if (type === 'food') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" color="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  }
  if (type === 'community') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" color="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (type === 'logistics') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" color="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" color="var(--accent-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" />
    </svg>
  );
}

export function SponsorsSection({ allies = [] }) {
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    orgName: '',
    type: 'Empresa privada',
    zone: 'Puntarenas',
    supportType: 'Donación de víveres e insumos'
  });

  const getIconType = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('empresa') || t.includes('platino')) return 'corporate';
    if (t.includes('aliment') || t.includes('seguridad')) return 'food';
    if (t.includes('comun') || t.includes('vecinal')) return 'community';
    if (t.includes('transporte') || t.includes('logística')) return 'logistics';
    return 'coop';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await requestConfirmation({ title: 'Registrar propuesta', text: '¿Querés aceptar esta propuesta de patrocinio de demostración?' }))) return;
    setFormSent(true);
    setTimeout(() => {
      setFormSent(false);
      setPartnerModalOpen(false);
    }, 2200);
  };

  return (
    <section className="sponsors-section animate-on-scroll">
      <div className="section-container">
        
        {/* Section Header */}
        <div className="sponsors-header">
          <div className="sponsors-badge">
            <span className="sparkle-dot"></span>
            RED DE PATROCINIO Y COOPERACIÓN
          </div>
          <h2>Patrocinadores y Alianzas Solidarias</h2>
          <p>
            CR Conecta articula el compromiso de empresas, fundaciones y colectivos comunales para garantizar que la ayuda llegue a quienes más la necesitan en la región de Puntarenas.
          </p>
        </div>

        {/* Sponsor Grid with Lightweight Hover Micro-interactions */}
        <div className="sponsors-grid">
          {allies.map((sponsor, index) => {
            const iconType = getIconType(sponsor.type + ' ' + (sponsor.category || ''));
            return (
              <div 
                key={sponsor.id || index} 
                className="sponsor-card card-gpu-optimized"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="sponsor-top">
                  <div className="sponsor-icon-wrap">
                    <SponsorIcon type={iconType} size={26} />
                  </div>
                  <span className="sponsor-category-pill">
                    {sponsor.badge || sponsor.category || 'Aliado'}
                  </span>
                </div>

                <div className="sponsor-body">
                  <h3>{sponsor.name}</h3>
                  <div className="sponsor-zone">
                    <MapPin className="i i-l" size={13} />{sponsor.zone} · <span className="sponsor-type">{sponsor.type}</span>
                  </div>
                  <p className="sponsor-support">
                    "{sponsor.support}"
                  </p>
                </div>

                <div className="sponsor-footer">
                  <span className="verified-seal">
                    <Check className="i i-l" size={14} />Colaboración activa de demostración
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action Banner for New Sponsors */}
        <div className="sponsor-cta-banner card-gpu-optimized">
          <div className="sponsor-cta-content">
            <div className="cta-icon-pill"><Handshake size={22} /></div>
            <div>
              <h3>¿Representás a una empresa, cooperativa u organización comunitaria?</h3>
              <p>
                Sumate como patrocinador o centro de acopio y fortalecé la red de protección social en el Pacífico central.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn primary sponsor-cta-btn"
            onClick={() => setPartnerModalOpen(true)}
          >
            Vincular mi organización<ArrowRight className="i i-r" size={14} />
          </button>
        </div>

      </div>

      {/* Modal for Joining as Sponsor/Ally */}
      {partnerModalOpen && (
        <div className="modal-backdrop" onClick={() => setPartnerModalOpen(false)}>
          <div className="modal sponsor-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-mark"><Handshake size={26} /></div>
            <h3>Unirse a la Red de Patrocinadores</h3>
            <p>
              Registrá una propuesta de alianza ficticia para la demostración de CR Conecta.
            </p>

            {formSent ? (
              <div className="success-banner" style={{ marginTop: '16px' }}>
                <Check className="i i-l" size={14} />¡Solicitud de patrocinio registrada con éxito para la demostración!
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <CostaRicaFields value={partnerForm} nameField="orgName" onChange={patch => setPartnerForm(current => ({ ...current, ...patch }))} />
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>
                    Nombre de la Empresa o Entidad *
                  </label>
                  <input
                    required
                    type="text"
                    value={partnerForm.orgName}
                    onChange={e => setPartnerForm({ ...partnerForm, orgName: e.target.value })}
                    placeholder="Ej. Distribuidora del Pacífico S.A."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>
                      Tipo de Entidad
                    </label>
                    <select
                      value={partnerForm.type}
                      onChange={e => setPartnerForm({ ...partnerForm, type: e.target.value })}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.78125rem' }}
                    >
                      <option value="Empresa privada">Empresa privada</option>
                      <option value="Cooperativa local">Cooperativa local</option>
                      <option value="Fundación sin fines de lucro">Fundación ONG</option>
                      <option value="Asociación vecinal">Asociación vecinal</option>
                    </select>
                  </div>

                  
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>
                    Tipo de Apoyo o Patrocinio propuesto *
                  </label>
                  <input
                    required
                    type="text"
                    value={partnerForm.supportType}
                    onChange={e => setPartnerForm({ ...partnerForm, supportType: e.target.value })}
                    placeholder="Ej. Espacio para acopio temporal, vehículos o víveres"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn secondary" onClick={() => setPartnerModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn primary">
                    Enviar propuesta de patrocinio<ArrowRight className="i i-r" size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
