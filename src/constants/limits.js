// Configuración centralizada de líneas de apoyo y límites para solicitudes (RF-10)
export const CATEGORY_LIMITS = {
  'Alimentos sellados': {
    maxPerRequest: 20,
    unit: 'paquetes',
    label: 'Alimentos sellados',
    description: 'Máximo 20 paquetes familiares por solicitud estándar.'
  },
  'Vestimenta': {
    maxPerRequest: 15,
    unit: 'piezas',
    label: 'Vestimenta',
    description: 'Máximo 15 piezas de ropa por núcleo familiar.'
  },
  'Calzado': {
    maxPerRequest: 10,
    unit: 'pares',
    label: 'Calzado',
    description: 'Máximo 10 pares por coordinación comunitaria.'
  },
  'Mobiliario': {
    maxPerRequest: 2,
    unit: 'lotes',
    label: 'Mobiliario esencial',
    description: 'Máximo 2 lotes de mobiliario básico por solicitud.'
  },
  'Electrodomésticos': {
    maxPerRequest: 1,
    unit: 'unidades',
    label: 'Electrodomésticos',
    description: 'Máximo 1 unidad esencial (refrigerador, plantilla, etc.).'
  },
  'Salud y medicamentos': {
    maxPerRequest: 12,
    unit: 'kits',
    label: 'Salud y medicamentos',
    description: 'Máximo 12 kits de apoyo, según prescripción médica y prioridad.'
  },
  'Educación y materiales': {
    maxPerRequest: 8,
    unit: 'kits',
    label: 'Educación y materiales',
    description: 'Máximo 8 kits de apoyo para material escolar o formativo.'
  },
  'Apoyo emocional y acompañamiento': {
    maxPerRequest: 4,
    unit: 'sesiones',
    label: 'Apoyo emocional y acompañamiento',
    description: 'Máximo 4 sesiones o acompañamientos por caso.'
  },
  'Reparación del hogar': {
    maxPerRequest: 3,
    unit: 'trabajos',
    label: 'Reparación del hogar',
    description: 'Máximo 3 intervenciones de mantenimiento esenciales por hogar.'
  },
  'Higiene y cuidado personal': {
    maxPerRequest: 10,
    unit: 'kits',
    label: 'Higiene y cuidado personal',
    description: 'Máximo 10 kits básicos de higiene para personas y hogares en riesgo.'
  },
  'Tecnología y conectividad': {
    maxPerRequest: 3,
    unit: 'kits',
    label: 'Tecnología y conectividad',
    description: 'Máximo 3 kits de conectividad o dispositivos básicos por familia.'
  },
  'Transporte y movilidad': {
    maxPerRequest: 6,
    unit: 'viajes',
    label: 'Transporte y movilidad',
    description: 'Máximo 6 viajes de traslado para acceso a salud, trabajo o educación.'
  },
  'Asistencia legal y documentación': {
    maxPerRequest: 2,
    unit: 'trámites',
    label: 'Asistencia legal y documentación',
    description: 'Máximo 2 trámites o gestiones legales y documentarias por caso.'
  },
  'Apoyo para adultos mayores': {
    maxPerRequest: 5,
    unit: 'sesiones',
    label: 'Apoyo para adultos mayores',
    description: 'Máximo 5 sesiones de acompañamiento para atención y revisiones domiciliarias.'
  },
  'Emergencia y contingencia': {
    maxPerRequest: 4,
    unit: 'kits',
    label: 'Emergencia y contingencia',
    description: 'Máximo 4 kits de respuesta inmediata para situaciones de crisis o desastre.'
  }
};

export const CATEGORY_OPTIONS = Object.keys(CATEGORY_LIMITS);

export function getCategoryUnit(category, fallback = 'unidades') {
  return CATEGORY_LIMITS[category]?.unit || fallback;
}

/**
 * Evalúa si una solicitud supera los límites configurados
 * @param {string} category 
 * @param {number} amount 
 * @param {Array} previousRequests 
 * @returns {Object} { exceeded: boolean, reason: string, maxAllowed: number }
 */
export function checkRequestLimits(category, amount, previousRequests = []) {
  const config = CATEGORY_LIMITS[category];
  const numAmount = Number(amount);

  if (!config) {
    return { exceeded: true, reason: 'La categoría de la solicitud no es válida.', maxAllowed: 0 };
  }

  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return { exceeded: true, reason: 'La cantidad debe ser un número positivo y válido.', maxAllowed: config.maxPerRequest };
  }

  // 1. Verificación de cantidad por solicitud
  if (numAmount > config.maxPerRequest) {
    return {
      exceeded: true,
      maxAllowed: config.maxPerRequest,
      reason: `La cantidad solicitada (${numAmount} ${config.unit}) excede el límite máximo configurado de ${config.maxPerRequest} ${config.unit} para la categoría ${category}.`
    };
  }

  // 2. Verificación de historial de ayudas recientes
  const recentCutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const activeSameCategory = previousRequests.filter(r => {
    const requestTime = Date.parse(r.date);
    return r.category === category
      && (r.status === 'Aprobada' || r.status === 'En revisión')
      && Number.isFinite(requestTime)
      && requestTime >= recentCutoff;
  });
  const totalAccumulated = activeSameCategory.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const historicalThreshold = config.maxPerRequest * 2;
  if (totalAccumulated + numAmount > historicalThreshold) {
    return {
      exceeded: true,
      maxAllowed: historicalThreshold,
      reason: `El historial acumulado de la familia en ${category} (${totalAccumulated + numAmount} ${config.unit}) supera el umbral de recurrencia bimestral (${historicalThreshold} ${config.unit}).`
    };
  }

  return { exceeded: false, reason: '', maxAllowed: config.maxPerRequest };
}
