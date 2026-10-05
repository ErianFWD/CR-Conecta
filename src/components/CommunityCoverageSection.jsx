import { useState } from 'react';
import { Building2, Clock, MapPin } from 'lucide-react';

export function CommunityCoverageSection({ facilities = [] }) {
  const [selectedZone, setSelectedZone] = useState('Todas');

  const zonesInfo = [
    {
      name: 'Puntarenas Centro',
      key: 'Puntarenas',
      tag: 'Centro de Acopio Principal',
      description: 'Nodo logístico principal con bodega de almacenamiento y punto de coordinación para traslados hacia los distritos periféricos.'
    },
    {
      name: 'Barranca',
      key: 'Barranca',
      tag: 'Zona de Atención Prioritaria',
      description: 'Concentra la mayor atención de paquetes de alimentos y apoyo a familias en condición de vulnerabilidad socioeconómica.'
    },
    {
      name: 'El Roble',
      key: 'El Roble',
      tag: 'Punto Comunitario Activo',
      description: 'Centro de distribución especializado en vestimenta familiar, calzado y coordinación de actividades con personas voluntarias.'
    },
    {
      name: 'Chacarita',
      key: 'Chacarita',
      tag: 'Red Vecinal de Base',
      description: 'Punto articulador de donaciones de mobiliario esencial, mesas, camas y electrodomésticos en coordinación con la Alianza Comunitaria.'
    }
  ];

  const filteredZones = selectedZone === 'Todas' 
    ? zonesInfo 
    : zonesInfo.filter(z => z.key === selectedZone);

  return (
    <section className="coverage-section animate-on-scroll">
      <div className="section-container">
        
        <div className="coverage-header-flex">
          <div>
            <span className="eyebrow-pill">IMPACTO TERRITORIAL</span>
            <h2>Zonas de Cobertura y Centros de Apoyo</h2>
            <p>
              CR Conecta opera con nodos comunitarios geográficamente distribuidos en el cantón central de Puntarenas.
            </p>
          </div>

          <div className="zone-filter-pills">
            <button 
              className={selectedZone === 'Todas' ? 'active' : ''} 
              onClick={() => setSelectedZone('Todas')}
            >
              Todos los distritos
            </button>
            {zonesInfo.map(z => (
              <button 
                key={z.key} 
                className={selectedZone === z.key ? 'active' : ''}
                onClick={() => setSelectedZone(z.key)}
              >
                {z.key}
              </button>
            ))}
          </div>
        </div>

        <div className="coverage-cards-grid">
          {filteredZones.map((zone, idx) => {
            const facility = facilities.find(item => item.zone === zone.key);
            return (
              <div key={zone.key} className="coverage-card card-gpu-optimized" style={{ animationDelay: `${idx * 70}ms` }}>
              <div className="coverage-card-top">
                <span className="coverage-tag">{zone.tag}</span>
                <span className="coverage-badge-live">{facility ? 'Enlace registrado · Demo' : 'Zona referencial'}</span>
              </div>

              <h3>{zone.name}</h3>
              <p className="coverage-desc">{zone.description}</p>

              <div className="coverage-facility-box">
                <div className="facility-title"><Building2 className="i i-l" size={14} />{facility?.name || 'Sin centro registrado'}</div>
                <div className="facility-detail"><MapPin className="i i-l" size={13} />{facility?.address || 'Dirección no disponible'}</div>
                <div className="facility-detail"><Clock className="i i-l" size={13} />{facility?.hours || 'Horario no disponible'}</div>
              </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
