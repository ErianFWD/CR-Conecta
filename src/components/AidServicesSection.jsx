import { useState } from 'react';
import { ArrowRight, ClipboardList, Handshake, House, Package, Shirt, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AidServicesSection({ displayNeeds = [], onOpenNeedModal }) {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'active-cases'

  const aidCategories = [
    {
      id: 'alimentos',
      name: 'Alimentos sellados',
      tag: 'SEGURIDAD ALIMENTARIA',
      icon: <Package size={22} />,
      headerBg: '#f6eedf',
      accentColor: '#b65b45',
      summary: 'Paquetes de víveres esenciales y no perecederos para la nutrición del núcleo familiar.',
      includes: [
        'Granos básicos: arroz, frijoles y cereales',
        'Leche en polvo y suplementos infantiles',
        'Aceite, pastas y alimentos enlatados sellados'
      ],
      limitTag: 'Hasta 20 paquetes estándar (RF-10)',
      targetCategory: 'Alimentos sellados'
    },
    {
      id: 'vestimenta',
      name: 'Vestimenta',
      tag: 'ABRIGO FAMILIAR',
      icon: <Shirt size={22} />,
      headerBg: '#def1f6',
      accentColor: 'var(--info-fg)',
      summary: 'Prendas limpias y clasificadas por tallas para niñas, niños y adultos.',
      includes: [
        'Ropa escolar e infantil por edades',
        'Prendas de abrigo para temporada fría',
        'Sábanas y textiles de hogar'
      ],
      limitTag: 'Hasta 15 piezas por hogar (RF-10)',
      targetCategory: 'Vestimenta'
    },
    {
      id: 'calzado',
      name: 'Calzado',
      tag: 'MOVILIDAD Y CONFORT',
      icon: <Handshake size={22} />,
      headerBg: '#edfaf4',
      accentColor: '#1b7a5b',
      summary: 'Calzado seguro y funcional para estudiantes, adultos mayores y personas en actividad laboral.',
      includes: [
        'Zapatos escolares y de trabajo',
        'Sandalias y calzado resistente',
        'Ajuste para clima y protección del pie'
      ],
      limitTag: 'Hasta 10 pares por caso (RF-10)',
      targetCategory: 'Calzado'
    },
    {
      id: 'mobiliario',
      name: 'Mobiliario esencial',
      tag: 'HABITABILIDAD Y DIGNIDAD',
      icon: <House size={22} />,
      headerBg: '#eaf1f5',
      accentColor: '#3d6c82',
      summary: 'Artículos indispensables para restituir las condiciones mínimas de vivienda de la familia.',
      includes: [
        'Juegos de mesa y sillas esenciales',
        'Camas, bases y colchones básicos',
        'Muebles para almacenamiento de enseres'
      ],
      limitTag: 'Hasta 2 lotes esenciales (RF-10)',
      targetCategory: 'Mobiliario'
    },
    {
      id: 'electrodomesticos',
      name: 'Electrodomésticos básicos',
      tag: 'PRESERVACIÓN Y COCINA',
      icon: <Zap size={22} />,
      headerBg: '#f2ecf7',
      accentColor: '#6b3d82',
      summary: 'Equipamiento imprescindible para la preparación e higiene en la conservación de alimentos.',
      includes: [
        'Refrigeradoras de bajo consumo energético',
        'Plantillas de cocina eléctricas o de gas',
        'Artefactos para hervir o purificar agua'
      ],
      limitTag: 'Máximo 1 unidad esencial (RF-10)',
      targetCategory: 'Electrodomésticos'
    },
    {
      id: 'salud',
      name: 'Salud y medicamentos',
      tag: 'ATENCIÓN BÁSICA',
      icon: <Handshake size={22} />,
      headerBg: '#fef3ec',
      accentColor: '#c2692d',
      summary: 'Kits de apoyo para continuidad de tratamientos, cuidado personal y apoyo médico básico.',
      includes: [
        'Medicamentos básicos y suplementos',
        'Kits de higiene y cuidado personal',
        'Apoyo para continuidad de atención'
      ],
      limitTag: 'Hasta 12 kits por caso (RF-10)',
      targetCategory: 'Salud y medicamentos'
    },
    {
      id: 'higiene',
      name: 'Higiene y cuidado personal',
      tag: 'SALUD Y DIGNIDAD',
      icon: <Package size={22} />,
      headerBg: '#fff4ef',
      accentColor: '#d76c53',
      summary: 'Kits de higiene para familias con necesidades urgentes de cuidado y prevención.',
      includes: [
        'Jabón, papel higiénico y toallas',
        'Artículos de cuidado personal infantil y adulto',
        'Productos para prevención y limpieza diaria'
      ],
      limitTag: 'Hasta 10 kits por hogar (RF-10)',
      targetCategory: 'Higiene y cuidado personal'
    },
    {
      id: 'tecnologia',
      name: 'Tecnología y conectividad',
      tag: 'ACCESO DIGITAL',
      icon: <Zap size={22} />,
      headerBg: '#ecf7ff',
      accentColor: 'var(--info-fg)',
      summary: 'Acompañamiento y equipos básicos para mantener acceso a educación, trámites y comunicación.',
      includes: [
        'Kits con acceso a internet o datos',
        'Dispositivos y accesorios básicos',
        'Soporte para estudiantes y personas en búsqueda laboral'
      ],
      limitTag: 'Hasta 3 kits por familia (RF-10)',
      targetCategory: 'Tecnología y conectividad'
    },
    {
      id: 'transporte',
      name: 'Transporte y movilidad',
      tag: 'ACCESO Y MOVILIDAD',
      icon: <House size={22} />,
      headerBg: '#f3f0ff',
      accentColor: '#5f4dac',
      summary: 'Traslados puntuales para acceder a centros de salud, trabajo, educación o servicios básicos.',
      includes: [
        'Traslado a instituciones de salud',
        'Viajes de ida y vuelta para educación',
        'Apoyo para desplazamiento laboral o administrativo'
      ],
      limitTag: 'Hasta 6 viajes por caso (RF-10)',
      targetCategory: 'Transporte y movilidad'
    },
    {
      id: 'legal',
      name: 'Asistencia legal y documentación',
      tag: 'PROTECCIÓN Y DERECHOS',
      icon: <ClipboardList size={22} />,
      headerBg: '#edf8f3',
      accentColor: '#26735a',
      summary: 'Gestión de documentos y orientación legal para fortalecer la protección y el acceso a derechos.',
      includes: [
        'Trámites de identificación y documentación',
        'Apoyo a casos de protección y empoderamiento',
        'Orientación para servicios públicos y comunitarios'
      ],
      limitTag: 'Hasta 2 trámites por caso (RF-10)',
      targetCategory: 'Asistencia legal y documentación'
    },
    {
      id: 'adultos-mayores',
      name: 'Apoyo para adultos mayores',
      tag: 'CUIDADO Y ACOMPAÑAMIENTO',
      icon: <Handshake size={22} />,
      headerBg: '#fff7dd',
      accentColor: '#b18614',
      summary: 'Acompañamiento para personas mayores con necesidades de cuidado, movilidad y contención.',
      includes: [
        'Sesiones de acompañamiento domiciliario',
        'Revisión de seguridad y alimentación',
        'Coordination con voluntariado y salud comunitaria'
      ],
      limitTag: 'Hasta 5 sesiones por caso (RF-10)',
      targetCategory: 'Apoyo para adultos mayores'
    },
    {
      id: 'emergencia',
      name: 'Emergencia y contingencia',
      tag: 'RESPUESTA RÁPIDA',
      icon: <Package size={22} />,
      headerBg: 'var(--danger-bg)',
      accentColor: '#b33535',
      summary: 'Soporte inmediato para crisis temporales, desastres o interrupciones severas del hogar.',
      includes: [
        'Kits para contingencias domésticas',
        'Apoyo urgente en momentos de crisis',
        'Coordination con redes comunitarias y de salud'
      ],
      limitTag: 'Hasta 4 kits por evento (RF-10)',
      targetCategory: 'Emergencia y contingencia'
    }
  ];

  const donationImages = {
    alimentos: {
      src: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
      alt: 'Alimentos frescos preparados para compartir'
    },
    vestimenta: {
      src: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80',
      alt: 'Prendas de vestir listas para donar'
    },
    calzado: {
      src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      alt: 'Calzado deportivo en buen estado'
    },
    mobiliario: {
      src: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      alt: 'Mobiliario esencial para el hogar'
    },
    electrodomesticos: {
      src: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
      alt: 'Electrodomésticos para el hogar'
    },
    salud: {
      src: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80',
      alt: 'Insumos de salud y primeros auxilios'
    },
    higiene: {
      src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80',
      alt: 'Productos de higiene y cuidado personal'
    },
    tecnologia: {
      src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      alt: 'Computadora portátil para acceso digital'
    },
    transporte: {
      src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80',
      alt: 'Vehículo para apoyar traslados comunitarios'
    },
    legal: {
      src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
      alt: 'Documentos para orientación y asistencia legal'
    },
    'adultos-mayores': {
      src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
      alt: 'Acompañamiento y cuidado para personas mayores'
    },
    emergencia: {
      src: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80',
      alt: 'Paquetes de ayuda para atención de emergencias'
    }
  };

  return (
    <section className="needs-section animate-on-scroll" id="ayudas-ofrecidas">
      <div className="section-container">
        
        {/* Section Intro with Remodeled Heading */}
        <div className="section-intro" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '750px' }}>
            <span className="eyebrow" style={{ display: 'inline-block', marginBottom: '8px' }}>
              PROGRAMAS Y MODALIDADES DE APOYO
            </span>
            <h2 style={{ margin: '0 0 10px', fontSize: '2.375rem', letterSpacing: '-1.5px', color: 'var(--navy)', fontWeight: '800' }}>
              ¿Qué ayudas ofrecemos?
            </h2>
            <p style={{ margin: 0, fontSize: '0.96875rem', color: 'var(--muted)', lineHeight: '1.6' }}>
              En CR Conecta coordinamos y canalizamos asistencia en 12 líneas prioritarias para las familias en condición de vulnerabilidad de Puntarenas, con validación comunitaria, respuesta rápida y límites que aseguran equidad.
            </p>
          </div>

          {/* Switcher Toggle */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-soft)', padding: '5px', borderRadius: '30px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              style={{
                border: 'none',
                background: activeTab === 'categories' ? 'var(--brand-solid)' : 'transparent',
                color: activeTab === 'categories' ? '#ffffff' : '#4b657c',
                padding: '9px 18px',
                borderRadius: '24px',
                fontWeight: '700',
                fontSize: '0.78125rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Package className="i i-l" size={16} />Tipos de ayuda que brindamos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active-cases')}
              style={{
                border: 'none',
                background: activeTab === 'active-cases' ? 'var(--brand-solid)' : 'transparent',
                color: activeTab === 'active-cases' ? '#ffffff' : '#4b657c',
                padding: '9px 18px',
                borderRadius: '24px',
                fontWeight: '700',
                fontSize: '0.78125rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ClipboardList className="i i-l" size={16} />Solicitudes activas cerca de vos
            </button>
          </div>
        </div>

        {/* TAB 1: 4 CATEGORIES OF ASSISTANCE WE OFFER */}
        {activeTab === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '30px' }} className="aid-categories-grid">
            {aidCategories.map(cat => (
              <article
                key={cat.id}
                className="aid-category-card card-gpu-optimized"
                style={{
                  '--category-accent': cat.accentColor
                }}
              >
                <div className="aid-card-image">
                  <img
                    src={donationImages[cat.id].src}
                    alt={donationImages[cat.id].alt}
                    loading="lazy"
                  />
                  <span className="aid-image-icon" aria-hidden="true">{cat.icon}</span>
                </div>

                <div className="aid-card-body">
                  <span className="aid-card-tag">
                    {cat.tag}
                  </span>

                  <h3>
                    {cat.name}
                  </h3>

                  <p className="aid-card-summary">
                    {cat.summary}
                  </p>

                  <div className="aid-card-includes">
                    <span className="aid-includes-title">¿Qué incluye?</span>
                    {cat.includes.map((item, i) => (
                      <div key={i} className="aid-include-item">
                        <span aria-hidden="true">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="aid-card-footer">
                    <span className="aid-limit-tag">
                      {cat.limitTag}
                    </span>
                    <Link
                      to="/solicitar"
                      className="aid-request-link"
                    >
                      Solicitar<ArrowRight className="i i-r" size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* TAB 2: ACTIVE APPROVED CASES MATCHING MOCKUP */}
        {activeTab === 'active-cases' && (
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.78125rem', color: 'var(--muted)' }}>
                Mostrando solicitudes aprobadas de demostración en Puntarenas con identidad protegida (RF-06):
              </span>
              <Link to="/necesidades" className="text-link" style={{ fontSize: '0.78125rem' }}>
                Ver todas en el catálogo<ArrowRight className="i i-r" size={14} />
              </Link>
            </div>

            <div className="need-grid">
              {displayNeeds.map((r, i) => {
                const mockPercentages = [45, 70, 25];
                const progress = r.received && r.goal 
                  ? Math.min(100, Math.round((r.received / r.goal) * 100))
                  : (mockPercentages[i % 3] || 50);

                const icons = [<Package size={22} />, <Shirt size={22} />, <House size={22} />];

                return (
                  <article key={r.id} className={`need-card c${i % 3} card-gpu-optimized`}>
                    <div className="need-top">
                      <div className="icon-square">
                        {icons[i % 3]}
                      </div>
                    </div>

                    <div className="need-body">
                      <span className={`priority ${(r.priority || 'media').toLowerCase()}`}>
                        PRIORIDAD {(r.priority || 'MEDIA').toUpperCase()}
                      </span>

                      <h3>{r.description}</h3>
                      <p>{r.zone} · Progreso de ejemplo {progress}%</p>

                      <div className="progress">
                        <span style={{ width: `${progress}%` }} />
                      </div>

                      <div className="need-foot">
                        <span>{r.category}</span>
                        <button type="button" onClick={() => onOpenNeedModal(r)}>
                          Ver ficha pública (RF-06)<ArrowRight className="i i-r" size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Strip */}
        <div 
          style={{
            marginTop: '34px',
            background: 'var(--white)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(6, 36, 74, 0.02)'
          }}
          className="card-gpu-optimized"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Handshake size={26} />
            <div>
              <strong style={{ fontSize: '0.875rem', color: 'var(--navy)', display: 'block' }}>
                ¿Tu familia o comunidad necesita alguna de estas ayudas?
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Podés formular una solicitud en línea. Se registrará en estado "En revisión" para validación comunitaria.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link className="btn primary" to="/solicitar" style={{ padding: '10px 20px', fontSize: '0.78125rem' }}>
              Solicitar ayuda (RF-07)<ArrowRight className="i i-r" size={14} />
            </Link>
            <Link className="btn secondary" to="/donar" style={{ padding: '10px 20px', fontSize: '0.78125rem' }}>
              Quiero donar<ArrowRight className="i i-r" size={14} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
