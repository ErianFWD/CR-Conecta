import { useState } from 'react';
import { Check, ClipboardList, QrCode, Scale, ShieldCheck, Truck } from 'lucide-react';

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Detección y Validación de Necesidades',
      subtitle: 'Protección de datos y verificación de vulnerabilidad',
      description: 'Las familias y líderes vecinales formulan solicitudes con categorías específicas (alimentos, ropa, mobiliario o electrodomésticos). El sistema compara en tiempo real contra los límites estándar para evitar excesos o duplicidades.',
      features: [
        'Registro con estado inicial "En revisión"',
        'Validación automatizada de límites máximos por categoría (RF-10)',
        'Protección total de la identidad y domicilio exacto del solicitante'
      ],
      icon: <ClipboardList size={26} />
    },
    {
      num: '02',
      title: 'Evaluación Administrativa y Asignación',
      subtitle: 'Priorización transparente y excepciones justificadas',
      description: 'El equipo administrador analiza cada caso, asigna prioridad (Alta, Media o Baja) y emite un dictamen con fecha y justificación. Las solicitudes que exceden límites quedan bloqueadas hasta que se autorice una excepción formal.',
      features: [
        'Dictamen formal: Aprobada o Denegada con motivo registrado (RF-08)',
        'Asignación cromática de Prioridad: Alta, Media o Baja (RF-09)',
        'Fichas públicas limitadas autorizadas para donantes y voluntarios (RF-06)'
      ],
      icon: <Scale size={26} />
    },
    {
      num: '03',
      title: 'Donaciones, Trazabilidad y Entrega',
      subtitle: 'Seguimiento simulado con código QR y confirmación',
      description: 'Tanto personas individuales como empresas registran aportes dirigidos a una necesidad concreta o a la institución. Los voluntarios coordinan el traslado y la persona beneficiaria confirma la recepción de la ayuda.',
      features: [
        'Opción de modo anónimo para proteger al donante',
        'Códigos QR de consulta local para comprobantes de entrega',
        'Confirmación directa de recepción por parte de la persona beneficiaria'
      ],
      icon: <Truck size={26} />
    }
  ];

  return (
    <section className="how-it-works-section animate-on-scroll">
      <div className="section-container">
        
        <div className="section-header-centered">
          <span className="eyebrow-pill">GUÍA INFORMATIVA DEL PROCESO</span>
          <h2>¿Cómo funciona CR Conecta?</h2>
          <p>
            Un modelo colaborativo diseñado para asegurar transparencia, equidad en la distribución y respeto a la privacidad de las familias en Puntarenas.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="steps-grid">
          {steps.map((st, i) => (
            <div 
              key={st.num}
              className={`step-card card-gpu-optimized ${activeStep === i ? 'step-active' : ''}`}
              onClick={() => setActiveStep(i)}
            >
              <div className="step-card-header">
                <div className="step-number">{st.num}</div>
                <div className="step-icon-badge">{st.icon}</div>
              </div>

              <h3>{st.title}</h3>
              <div className="step-subtitle">{st.subtitle}</div>
              <p className="step-desc">{st.description}</p>

              <div className="step-features-list">
                {st.features.map((feat, idx) => (
                  <div key={idx} className="step-feature-item">
                    <span className="check-bullet"><Check size={14} /></span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Transparence Pillars Banner */}
        <div className="transparency-strip card-gpu-optimized">
          <div className="transparency-item">
            <div className="transparency-icon"><ShieldCheck size={24} /></div>
            <div>
              <strong>Privacidad Asegurada</strong>
              <span>Fichas protegidas que resguardan datos personales.</span>
            </div>
          </div>
          <div className="transparency-divider" />
          <div className="transparency-item">
            <div className="transparency-icon"><Scale size={24} /></div>
            <div>
              <strong>Equidad y Límites</strong>
              <span>Límites configurados para que la ayuda alcance a más hogares.</span>
            </div>
          </div>
          <div className="transparency-divider" />
          <div className="transparency-item">
            <div className="transparency-icon"><QrCode size={24} /></div>
            <div>
              <strong>Trazabilidad Local</strong>
              <span>Comprobantes QR y confirmación mutua de traslados.</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
