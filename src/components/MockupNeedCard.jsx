import { ArrowRight, MapPin } from 'lucide-react';

export function MockupNeedCard({ r, index, onSelect }) {
  const mockPercentages = [45, 70, 25];
  const progress = r.received && r.goal 
    ? Math.min(100, Math.round((r.received / r.goal) * 100))
    : (mockPercentages[index % 3] || 50);

  const requestText = `${r.description || ''} ${r.category || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const needVisuals = [
    {
      match: ['utiles escolares', 'mochila escolar', 'cuadernos', 'mochila'],
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
      alt: 'Libros y materiales escolares para apoyar a estudiantes'
    },
    {
      match: ['uniformes escolares', 'uniforme escolar', 'uniforme'],
      image: 'https://images.unsplash.com/photo-1591219233007-4ac041f8c2be?auto=format&fit=crop&w=900&q=80',
      alt: 'Estudiantes con uniforme escolar caminando hacia clases'
    },
    {
      match: ['zapatos escolares', 'calzado escolar'],
      image: 'https://images.unsplash.com/photo-1653868250317-144a0c4f5884?auto=format&fit=crop&w=900&q=80',
      alt: 'Par de zapatos negros de vestir, similares al calzado escolar solicitado'
    },
    {
      match: ['ropa de abrigo', 'chaqueta', 'sueter'],
      image: 'https://images.unsplash.com/photo-1611911813383-67769b37a149?auto=format&fit=crop&w=900&q=80',
      alt: 'Suéter tejido abrigado para donar'
    },
    {
      match: ['alimento', 'comida', 'víveres'],
      image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=900&q=80',
      alt: 'Bolsas de donación con alimentos empacados y productos de despensa'
    },
    {
      match: ['ropa interior', 'bebe', 'infantil'],
      image: 'https://images.unsplash.com/photo-1768693602418-260d828b878d?auto=format&fit=crop&w=900&q=80',
      alt: 'Ropa de bebé preparada para entregar a una familia'
    },
    {
      match: ['vestimenta', 'ropa'],
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80',
      alt: 'Ropa organizada para donación'
    },
    {
      match: ['calzado', 'zapatos'],
      image: 'https://images.unsplash.com/photo-1653868250317-144a0c4f5884?auto=format&fit=crop&w=900&q=80',
      alt: 'Par de zapatos negros de vestir para donar'
    },
    {
      match: ['mobiliario', 'mueble', 'hogar'],
      image: 'https://images.unsplash.com/photo-1713365829670-d8df1e593248?auto=format&fit=crop&w=900&q=80',
      alt: 'Mesa de comedor con sillas para equipar un hogar'
    },
    {
      match: ['electrodoméstico', 'electrodomestico', 'cocina'],
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
      alt: 'Electrodomésticos para el hogar'
    },
    {
      match: ['salud', 'medicamento'],
      image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80',
      alt: 'Insumos de salud y primeros auxilios'
    },
    {
      match: ['higiene', 'cuidado personal'],
      image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80',
      alt: 'Productos de higiene y cuidado personal'
    },
    {
      match: ['tecnología', 'tecnologia', 'conectividad', 'digital'],
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      alt: 'Computadora portátil para acceso digital'
    },
    {
      match: ['transporte', 'movilidad'],
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80',
      alt: 'Vehículo para traslados comunitarios'
    },
    {
      match: ['legal', 'documentación', 'documentacion'],
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
      alt: 'Documentos para asistencia legal'
    },
    {
      match: ['adultos mayores', 'adulto mayor', 'acompañamiento'],
      image: 'https://images.unsplash.com/photo-1777904257177-f520bc1b10c3?auto=format&fit=crop&w=900&q=80',
      alt: 'Acompañamiento y cuidado comunitario'
    },
    {
      match: ['emergencia', 'contingencia'],
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80',
      alt: 'Paquetes de ayuda para emergencias'
    },
    {
      match: [],
      image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=900&q=80',
      alt: 'Voluntariado organizando productos de apoyo comunitario'
    }
  ];
  const visual = needVisuals.find(item => item.match.some(term => requestText.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))))
    || needVisuals[needVisuals.length - 1];

  return (
    <article className={`need-card needs-list-card c${index % 3}`} style={{ animationDelay: `${index * 75}ms` }}>
      <div className="need-top">
        <img className="need-photo" src={visual.image} alt={visual.alt} loading="lazy" />
        <span className="need-zone"><MapPin size={13} />{r.zone}</span>
        <span className="need-photo-label">CR CONECTA · APOYO COMUNITARIO</span>
      </div>

      <div className="need-body">
        <div className="need-card-meta">
          <span className="need-category-label">{r.category}</span>
          <span className={`priority ${(r.priority || 'media').toLowerCase()}`}>
            PRIORIDAD {(r.priority || 'MEDIA').toUpperCase()}
          </span>
        </div>

        <h3>{r.description}</h3>
        <p className="need-progress-copy">Apoyo comunitario · {progress}% reunido</p>

        <div className="progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="need-foot">
          <button type="button" onClick={onSelect}>
            Conocer esta necesidad<ArrowRight className="i i-r" size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
