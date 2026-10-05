import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, MapPin, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../lib/useData';
import { SponsorsSection } from '../components/SponsorsSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { CommunityCoverageSection } from '../components/CommunityCoverageSection';
import { HomeSections } from '../components/HomeSections';
import { AidServicesSection } from '../components/AidServicesSection';
import { DEFAULT_MAP_ZOOM, getMapBounds, MAX_MAP_ZOOM, MIN_MAP_ZOOM } from '../lib/mapZoom';

export function Home({ onOpenNeedModal, session }) {
  const { data: reqs = [] } = useData('/requests');
  const { data: transfers = [] } = useData('/transfers');
  const { data: allies = [] } = useData('/allies');
  const { data: facilities = [] } = useData('/facilities');
  const [selectedMapZone, setSelectedMapZone] = useState('Puntarenas Centro');
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);

  const mapZones = [
    { name: 'Puntarenas Centro', lat: 9.9763, lon: -84.8384, detail: 'Centro de coordinación y acopio' },
    { name: 'Barranca', lat: 9.9846, lon: -84.7163, detail: 'Atención y entrega de víveres' },
    { name: 'El Roble', lat: 9.9882, lon: -84.7348, detail: 'Vestimenta y apoyo comunitario' },
    { name: 'Chacarita', lat: 9.9778, lon: -84.7467, detail: 'Red vecinal y artículos para el hogar' }
  ];
  const activeMapZone = mapZones.find(zone => zone.name === selectedMapZone) || mapZones[0];
  const mapBounds = getMapBounds(activeMapZone, mapZoom);
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(mapBounds)}&layer=mapnik&marker=${activeMapZone.lat},${activeMapZone.lon}`;
  const mapLinkUrl = `https://www.openstreetmap.org/?mlat=${activeMapZone.lat}&mlon=${activeMapZone.lon}#map=${mapZoom}/${activeMapZone.lat}/${activeMapZone.lon}`;

  // Pick sample requests or fallback to mockup items
  const displayNeeds = useMemo(() => {
    if (reqs && reqs.length > 0) {
      return reqs.filter(r => r.status === 'Aprobada').slice(0, 3);
    }
    return [
      { id: 'CC-204', category: 'Alimentos sellados', description: 'Paquete de alimentos sellados', amount: 18, unit: 'paquetes', zone: 'Barranca', priority: 'Alta', goal: 18, received: 8 },
      { id: 'CC-205', category: 'Vestimenta', description: 'Vestimenta para una familia', amount: 12, unit: 'piezas', zone: 'El Roble', priority: 'Media', goal: 12, received: 9 },
      { id: 'CC-206', category: 'Mobiliario', description: 'Mesa y sillas esenciales', amount: 1, unit: 'lote', zone: 'Chacarita', priority: 'Media', goal: 1, received: 0 }
    ];
  }, [reqs]);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">UNA RED DE APOYO PARA COSTA RICA</span>
          <h1>
            Cuando nos<br />
            conectamos,<br />
            <span className="accent-text">la ayuda llega.</span>
          </h1>
          <p>
            Un espacio para acercar necesidades, donaciones y personas voluntarias. Descubrí cómo podés aportar a tu comunidad.
          </p>
          <div className="hero-buttons">
            <Link className="btn primary" to="/necesidades">
              Ver necesidades<ArrowUpRight className="i i-r" size={14} />
            </Link>
            <Link className="btn secondary" to="/donar">
              Quiero donar<ArrowRight className="i i-r" size={14} />
            </Link>
          </div>
          <div className="micro">
            <i /> Prototipo académico · Información ficticia
          </div>
        </div>

        {/* Interactive community map without an API key */}
        <div className="map-card">
          <div className="section-head">
            <div>
              <span className="eyebrow">RED LOCAL · PUNTARENAS</span>
              <h3>La ayuda, más cerca</h3>
            </div>
            <a className="map-open-link" href={mapLinkUrl} target="_blank" rel="noreferrer">
              Abrir mapa<ArrowUpRight size={15} />
            </a>
          </div>

          <div className="map-zone-list" aria-label="Seleccionar zona comunitaria">
            {mapZones.map(zone => (
              <button
                key={zone.name}
                type="button"
                className={selectedMapZone === zone.name ? 'map-zone-button active' : 'map-zone-button'}
                aria-pressed={selectedMapZone === zone.name}
                onClick={() => setSelectedMapZone(zone.name)}
              >
                {zone.name}
              </button>
            ))}
          </div>

          <div className="map-frame">
            <div className="map-embed-viewport">
              <iframe
                title={`Mapa de referencia: ${activeMapZone.name}, Puntarenas`}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="map-zoom-controls" role="group" aria-label="Zoom del mapa">
              <button type="button" aria-label="Acercar mapa" title="Acercar mapa"
                disabled={mapZoom >= MAX_MAP_ZOOM}
                onClick={() => setMapZoom(current => Math.min(MAX_MAP_ZOOM, current + 1))}>
                <Plus size={18} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Alejar mapa" title="Alejar mapa"
                disabled={mapZoom <= MIN_MAP_ZOOM}
                onClick={() => setMapZoom(current => Math.max(MIN_MAP_ZOOM, current - 1))}>
                <Minus size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="map-location-card">
              <span className="map-location-icon"><MapPin size={17} /></span>
              <span><strong>{activeMapZone.name}</strong><small>{activeMapZone.detail}</small></span>
              <span className="map-active-indicator">Zona de referencia</span>
            </div>
          </div>

          <div className="map-note">
            <i /> Mapa de OpenStreetMap. Zonas referenciales; no representan domicilios exactos.
          </div>
        </div>
      </section>

      {/* Remodeled Section: ¿Qué ayudas ofrecemos? (Categorías de apoyo + Casos activos) */}
      <AidServicesSection 
        displayNeeds={displayNeeds} 
        onOpenNeedModal={onOpenNeedModal} 
      />

      {/* 1. Informative Section: How CR Conecta Works */}
      <HowItWorksSection />

      {/* 2. Informative Section: Sponsors & Strategic Allies */}
      <SponsorsSection allies={allies || []} />

      {/* 3. Informative Section: Territorial Coverage & Facilities */}
      <CommunityCoverageSection facilities={facilities || []} />

      {/* 4. Secciones publicadas por la comunidad */}
      <HomeSections session={session} />

      {/* Impact Indicators */}
      <section className="impact-strip">
        <div>
          <span className="eyebrow">DATOS DEL PROTOTIPO</span>
          <h2>Una vista clara del recorrido.</h2>
        </div>
        <div className="metrics">
          <div className="metric">
            <strong>{reqs?.length ?? 0}</strong>
            <span>Solicitudes visibles</span>
          </div>
          <div className="metric">
            <strong>{transfers?.length ?? 0}</strong>
            <span>Traslados visibles</span>
          </div>
          <div className="metric">
            <strong>08</strong>
            <span>Estados simulados</span>
          </div>
        </div>
      </section>
    </>
  );
}
