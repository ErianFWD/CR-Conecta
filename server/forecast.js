// Motor de proyección de CR Conecta.
// Calcula escenarios con los datos propios de la plataforma (donaciones, solicitudes,
// inventario y campañas). No depende de la IA: la IA solo redacta la interpretación.

const DAY = 86400000;
const WEEK = 7 * DAY;
const MAX_HISTORY_WEEKS = 12;
const Z_80 = 1.28; // banda orientativa ~80 % bajo aproximación normal
const ASSUMED_CV = 0.6; // variabilidad supuesta cuando el historial es demasiado corto
const CLOSED_REQUEST_STATUSES = new Set(['rechazada', 'cancelada', 'completada', 'cerrada', 'entregada']);
const REVIEW_REQUEST_STATUSES = new Set(['en revision', 'pendiente']);

export function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function toDay(value) {
  if (!value) return null;
  const time = Date.parse(String(value).slice(0, 10));
  return Number.isNaN(time) ? null : time;
}

function utcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function quantity(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

const round1 = value => Math.round(value * 10) / 10;

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sampleStd(values) {
  if (values.length < 2) return null;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

// Cuantil con interpolación lineal.
function quantile(values, q) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

// Media móvil exponencial: pesa más las semanas recientes. `values` va de la más antigua a la más reciente.
function ewma(values, alpha = 0.5) {
  if (!values.length) return 0;
  return values.slice(1).reduce((level, value) => alpha * value + (1 - alpha) * level, values[0]);
}

function slope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });
  return denominator ? numerator / denominator : 0;
}

// Función de distribución normal estándar (Abramowitz–Stegun 7.1.26).
function normalCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

// Ventanas de 7 días que terminan hoy; la última posición es la semana más reciente.
function weeklySeries(rows, todayDay, weeks) {
  const series = Array(weeks).fill(0);
  rows.forEach(row => {
    const offset = Math.floor((todayDay - row.day) / WEEK);
    if (offset >= 0 && offset < weeks) series[weeks - 1 - offset] += row.units;
  });
  return series;
}

function donationRows(donations) {
  return donations
    .map(donation => ({ day: toDay(donation.date), units: quantity(donation.quantity), category: String(donation.category || 'Sin categoría').slice(0, 80) }))
    .filter(row => row.day !== null && row.units > 0);
}

function historySpan(rows, todayDay) {
  const past = rows.filter(row => row.day <= todayDay);
  if (!past.length) return 0;
  const earliest = Math.min(...past.map(row => row.day));
  return Math.min(MAX_HISTORY_WEEKS, Math.max(1, Math.ceil((todayDay - earliest + DAY) / WEEK)));
}

function estimateRate(series, networkReference) {
  const activeWeeks = series.filter(value => value > 0).length;
  const own = ewma(series);
  const weight = Math.min(1, activeWeeks / 4);
  const rate = weight * own + (1 - weight) * networkReference;
  return { rate, own, weight, activeWeeks, usedNetworkReference: weight < 1 && networkReference > 0 };
}

function requestDemand(requests, category) {
  const key = normalize(category);
  const rows = requests.filter(request => normalize(request.category) === key);
  let pendingUnits = 0;
  let openRequests = 0;
  let highPriority = 0;
  let inReviewUnits = 0;
  rows.forEach(request => {
    const status = normalize(request.status);
    const target = quantity(request.goal ?? request.amount);
    const missing = Math.max(0, target - quantity(request.received));
    if (CLOSED_REQUEST_STATUSES.has(status)) return;
    if (REVIEW_REQUEST_STATUSES.has(status)) {
      inReviewUnits += target;
      return;
    }
    if (missing > 0) {
      pendingUnits += missing;
      openRequests += 1;
      if (normalize(request.priority) === 'alta') highPriority += 1;
    }
  });
  return { pendingUnits, openRequests, highPriority, inReviewUnits };
}

function stockSummary(inventory, category) {
  const key = normalize(category);
  const items = inventory.filter(item => normalize(item.category) === key);
  if (!items.length) return { items: 0, available: 0, reserved: 0, free: 0, minimum: 0, belowMinimum: 0 };
  const available = items.reduce((sum, item) => sum + quantity(item.available), 0);
  const reserved = items.reduce((sum, item) => sum + quantity(item.reserved), 0);
  return {
    items: items.length,
    available,
    reserved,
    free: Math.max(0, available - reserved),
    minimum: items.reduce((sum, item) => sum + quantity(item.minimum), 0),
    belowMinimum: items.filter(item => quantity(item.available) <= quantity(item.minimum)).length
  };
}

function campaignStatus(campaign, todayDay) {
  const start = toDay(campaign.start);
  const end = toDay(campaign.end);
  const goal = quantity(campaign.goal);
  const progress = Math.min(quantity(campaign.progress), goal || Infinity);
  const pctDone = goal ? Math.round((progress / goal) * 100) : 0;
  const base = { name: String(campaign.name || 'Campaña').slice(0, 80), unit: String(campaign.unit || 'unidades').slice(0, 30), goal, progress, pctDone, start: campaign.start || null, end: campaign.end || null };
  if (goal && progress >= goal) return { ...base, schedule: 'Meta alcanzada', expectedPct: 100, projectedPct: 100 };
  if (start === null || end === null || end <= start) return { ...base, schedule: 'Sin fechas', expectedPct: null, projectedPct: null };
  if (todayDay < start) return { ...base, schedule: 'Por iniciar', expectedPct: 0, projectedPct: null };
  const totalDays = (end - start) / DAY + 1;
  const elapsedDays = Math.min(totalDays, (todayDay - start) / DAY + 1);
  const expectedPct = Math.round((elapsedDays / totalDays) * 100);
  const paceDaily = progress / elapsedDays;
  const projectedPct = goal ? Math.min(150, Math.round(((progress + paceDaily * Math.max(0, totalDays - elapsedDays)) / goal) * 100)) : null;
  let schedule;
  if (todayDay > end) schedule = 'Finalizada';
  else if (pctDone >= expectedPct + 10) schedule = 'Adelantada';
  else if (pctDone <= expectedPct - 15) schedule = 'Atrasada';
  else schedule = 'En ritmo';
  return { ...base, schedule, expectedPct, projectedPct };
}

function confidenceLevel({ donationsInCategory, weeksWithData, weeksObserved }) {
  let level = 'Muy baja';
  if (donationsInCategory >= 3) level = 'Baja';
  if (weeksObserved >= 4 && weeksWithData >= 4 && donationsInCategory >= 8) level = 'Media';
  if (weeksObserved >= 8 && weeksWithData >= 6 && donationsInCategory >= 20) level = 'Alta';
  const reasons = [];
  reasons.push(`${donationsInCategory} ${donationsInCategory === 1 ? 'donación registrada' : 'donaciones registradas'} en la categoría y ${weeksWithData} de ${weeksObserved} semanas con actividad.`);
  if (level === 'Muy baja' || level === 'Baja') reasons.push('El historial es corto: tomá la cifra como orden de magnitud, no como pronóstico.');
  return { level, reasons };
}

function categoriesIn({ donations, requests, inventory, campaigns }) {
  const seen = new Map();
  [...donations, ...requests, ...inventory, ...campaigns].forEach(item => {
    const label = String(item.category || '').trim().slice(0, 80);
    if (label && !seen.has(normalize(label))) seen.set(normalize(label), label);
  });
  return [...seen.values()];
}

function networkContext(rows, todayDay, categories) {
  const weeks = historySpan(rows, todayDay);
  const perCategory = new Map(categories.map(label => [label, estimateRate(weeklySeries(rows.filter(row => normalize(row.category) === normalize(label)), todayDay, Math.max(weeks, 1)), 0)]));
  const withData = [...perCategory.values()].filter(entry => entry.activeWeeks > 0).map(entry => entry.own);
  // Referencia prudente: cuartil inferior de las categorías con actividad, para no sobrestimar categorías nuevas.
  return { weeks, reference: quantile(withData, 0.25) };
}

export function buildForecast({ scenario, campaigns = [], donations = [], requests = [], inventory = [], scope = 'admin', today = new Date() }) {
  const todayDay = utcDay(today);
  const allRows = donationRows(donations);
  const categories = categoriesIn({ donations, requests, inventory, campaigns });
  const network = networkContext(allRows, todayDay, categories);
  const weeksObserved = Math.max(network.weeks, 1);
  const key = normalize(scenario.category);
  const rows = allRows.filter(row => normalize(row.category) === key);
  const history = weeklySeries(rows, todayDay, weeksObserved);
  const weeksWithData = history.filter(value => value > 0).length;
  const estimate = estimateRate(history, network.reference);
  const rate = estimate.rate;

  // Tendencia (solo con historial suficiente) amortiguada a la mitad para no extrapolar en exceso.
  const enoughForTrend = history.length >= 4;
  const rawSlope = enoughForTrend ? slope(history.slice(-8)) : 0;
  const relativeSlope = rawSlope / Math.max(mean(history), 0.5);
  const trend = !enoughForTrend ? 'Sin datos suficientes' : relativeSlope > 0.1 ? 'Creciente' : relativeSlope < -0.1 ? 'Decreciente' : 'Estable';
  const dampedSlope = enoughForTrend ? rawSlope * 0.5 : 0;

  // Variabilidad.
  const std = sampleStd(history);
  const measuredCv = std !== null && history.length >= 3 && mean(history) > 0 ? std / mean(history) : null;
  const cv = Math.min(1, Math.max(0.25, measuredCv ?? ASSUMED_CV));
  const weeklySd = cv * rate;

  const cumulativeBase = [];
  const cumulativeLow = [];
  const cumulativeHigh = [];
  let running = 0;
  for (let week = 1; week <= scenario.weeks; week += 1) {
    running += Math.max(0, rate + dampedSlope * week);
    const sd = weeklySd * Math.sqrt(week);
    cumulativeBase.push(running);
    cumulativeLow.push(Math.max(0, running - Z_80 * sd));
    cumulativeHigh.push(running + Z_80 * sd);
  }
  const diffRounded = values => values.map((value, index) => Math.round(value) - (index ? Math.round(values[index - 1]) : 0));
  const weeklyUnits = diffRounded(cumulativeBase);
  const totalBase = Math.round(cumulativeBase.at(-1));
  const totalLow = Math.round(cumulativeLow.at(-1));
  const totalHigh = Math.round(cumulativeHigh.at(-1));
  const pct = value => Math.round((value / scenario.goal) * 100);

  const confidence = confidenceLevel({ donationsInCategory: rows.length, weeksWithData, weeksObserved });
  const sdTotal = weeklySd * Math.sqrt(scenario.weeks);
  let probability = null;
  if (confidence.level !== 'Muy baja' && rate > 0) {
    const raw = sdTotal > 0 ? 1 - normalCdf((scenario.goal - cumulativeBase.at(-1)) / sdTotal) : (cumulativeBase.at(-1) >= scenario.goal ? 1 : 0);
    const [floor, ceiling] = confidence.level === 'Baja' ? [15, 85] : [1, 99];
    probability = Math.min(ceiling, Math.max(floor, Math.round(raw * 100)));
  }
  const weeksToGoal = rate > 0 ? Math.ceil(scenario.goal / rate) : null;
  const completionDate = weeksToGoal && weeksToGoal <= 104 ? isoDay(todayDay + weeksToGoal * WEEK) : null;
  const requiredWeekly = round1(scenario.goal / scenario.weeks);

  // Demanda y existencias.
  const demand = requestDemand(requests, scenario.category);
  const stock = scope === 'admin' ? stockSummary(inventory, scenario.category) : null;
  const supply = totalBase + (stock?.free || 0);
  const coverage = demand.pendingUnits > 0 ? Math.round((supply / demand.pendingUnits) * 100) : null;

  // Campañas de la categoría.
  const categoryCampaigns = campaigns.filter(campaign => normalize(campaign.category) === key).slice(-5).map(campaign => campaignStatus(campaign, todayDay));

  // Panorama de todas las categorías para el mismo horizonte.
  const ownsCategory = label => [...donations, ...campaigns].some(item => normalize(item.category) === normalize(label));
  const outlookCategories = scope === 'admin' ? categories : categories.filter(ownsCategory);
  const outlook = outlookCategories.map(label => {
    const categoryRows = allRows.filter(row => normalize(row.category) === normalize(label));
    const categoryEstimate = estimateRate(weeklySeries(categoryRows, todayDay, weeksObserved), network.reference);
    const categoryDemand = requestDemand(requests, label);
    const categoryStock = scope === 'admin' ? stockSummary(inventory, label) : null;
    const inflow = categoryEstimate.rate * scenario.weeks;
    const available = inflow + (categoryStock?.free || 0);
    const shortfall = Math.max(0, Math.round(categoryDemand.pendingUnits - available));
    let status = 'Sin demanda';
    if (categoryDemand.pendingUnits > 0) {
      const ratio = available / categoryDemand.pendingUnits;
      status = ratio >= 1 ? 'Cubierta' : ratio >= 0.6 ? 'Ajustada' : 'Déficit';
    }
    return {
      category: label,
      weeklyRate: round1(categoryEstimate.rate),
      projectedInflow: Math.round(inflow),
      freeStock: categoryStock ? categoryStock.free : null,
      pendingDemand: categoryDemand.pendingUnits,
      shortfall,
      status,
      donations: categoryRows.length
    };
  }).sort((a, b) => b.shortfall - a.shortfall || b.pendingDemand - a.pendingDemand).slice(0, 8);

  // Lecturas automáticas.
  const insights = [];
  if (rate <= 0) {
    insights.push({ level: 'warn', text: 'No hay donaciones registradas ni referencia de la red para esta categoría; la proyección queda en cero hasta que existan datos.' });
  } else if (requiredWeekly > rate * 1.25) {
    insights.push({ level: 'warn', text: `La meta exige ${requiredWeekly} unidades por semana y el ritmo estimado es ${round1(rate)} (${Math.round((rate / requiredWeekly) * 100)} % de lo necesario).` });
  } else {
    insights.push({ level: 'ok', text: `El ritmo estimado (${round1(rate)} por semana) alcanza para la exigencia de ${requiredWeekly} por semana.` });
  }
  if (trend === 'Decreciente') insights.push({ level: 'warn', text: 'Los aportes vienen bajando en las últimas semanas; el escenario base ya lo descuenta parcialmente.' });
  if (trend === 'Creciente') insights.push({ level: 'ok', text: 'Los aportes vienen subiendo en las últimas semanas.' });
  if (demand.pendingUnits > 0) {
    const text = `Hay ${demand.pendingUnits} unidades pendientes en ${demand.openRequests} ${demand.openRequests === 1 ? 'solicitud aprobada' : 'solicitudes aprobadas'}${demand.highPriority ? ` (${demand.highPriority} de prioridad alta)` : ''}. ${stock ? 'Con existencias libres y aportes proyectados' : 'Con tus aportes proyectados'} se cubre ${coverage >= 300 ? 'más de 300' : coverage} % de esa demanda.`;
    insights.push({ level: coverage >= 100 ? 'ok' : coverage >= 60 ? 'info' : 'warn', text });
  }
  if (demand.inReviewUnits > 0) insights.push({ level: 'info', text: `Hay ${demand.inReviewUnits} unidades más en solicitudes todavía en revisión que podrían sumarse a la demanda.` });
  if (stock?.belowMinimum) insights.push({ level: 'warn', text: `${stock.belowMinimum} ${stock.belowMinimum === 1 ? 'producto está' : 'productos están'} en o bajo el mínimo de inventario en esta categoría.` });
  const lagging = categoryCampaigns.filter(campaign => campaign.schedule === 'Atrasada');
  if (lagging.length) insights.push({ level: 'warn', text: `${lagging.length === 1 ? 'Una campaña va atrasada' : `${lagging.length} campañas van atrasadas`} respecto del calendario: ${lagging.map(campaign => `«${campaign.name}» (${campaign.pctDone} % de avance frente a ${campaign.expectedPct} % esperado)`).join('; ')}.` });
  if (confidence.level === 'Muy baja' || confidence.level === 'Baja') insights.push({ level: 'info', text: 'El historial de esta categoría es corto, por lo que el rango de incertidumbre es amplio.' });
  const order = { warn: 0, info: 1, ok: 2 };
  insights.sort((a, b) => order[a.level] - order[b.level]);

  const assumptions = [
    `Se usan ${weeksObserved} ${weeksObserved === 1 ? 'semana' : 'semanas'} de historial de donaciones (ventanas de 7 días que terminan hoy), con más peso en las recientes.`,
    estimate.usedNetworkReference
      ? 'El historial de la categoría tiene menos de 4 semanas con actividad, por lo que el ritmo se mezcla con el cuartil inferior de las demás categorías de la plataforma (referencia prudente).'
      : 'El ritmo se calcula solo con la actividad propia de la categoría.',
    measuredCv === null
      ? `La variabilidad semanal se supone (${Math.round(ASSUMED_CV * 100)} %) porque el historial es insuficiente para medirla.`
      : `La variabilidad semanal se midió en ${Math.round(cv * 100)} % del promedio.`,
    scope === 'admin' ? 'Vista de administración: incluye todas las donaciones, solicitudes e inventario.' : 'Vista de empresa: usa solo las donaciones y campañas de tu cuenta y la demanda total agregada.'
  ];

  const forecast = {
    weeklyRate: round1(rate),
    trend,
    requiredWeekly,
    weeks: weeklyUnits.map((base, index) => ({
      week: index + 1,
      base,
      low: Math.max(0, Math.round(Math.max(0, rate + dampedSlope * (index + 1)) - Z_80 * weeklySd)),
      high: Math.round(Math.max(0, rate + dampedSlope * (index + 1)) + Z_80 * weeklySd),
      cumulativeBase: Math.round(cumulativeBase[index]),
      cumulativeLow: Math.round(cumulativeLow[index]),
      cumulativeHigh: Math.round(cumulativeHigh[index])
    })),
    totals: { base: totalBase, low: totalLow, high: totalHigh },
    goalCoverage: { base: pct(totalBase), low: pct(totalLow), high: pct(totalHigh) },
    probability,
    weeksToGoal,
    completionDate
  };

  return {
    scenario,
    scope,
    generatedAt: today.toISOString(),
    weeklyUnits,
    observedCampaigns: categoryCampaigns.length,
    assumptions,
    forecast,
    history: history.map((units, index) => ({ start: isoDay(todayDay - (history.length - index) * WEEK + DAY), units })),
    confidence,
    data: { donationsInCategory: rows.length, donationsTotal: allRows.length, weeksObserved, weeksWithData },
    demand,
    stock,
    coverage,
    campaigns: categoryCampaigns,
    outlook,
    insights
  };
}

export function automaticNarrative(result) {
  const { scenario, forecast, confidence, coverage, demand, outlook } = result;
  const lines = [];
  lines.push(`Para «${scenario.category}», con una meta de ${scenario.goal} unidades en ${scenario.weeks} ${scenario.weeks === 1 ? 'semana' : 'semanas'}, el ritmo estimado es de ${forecast.weeklyRate} por semana (tendencia: ${forecast.trend.toLowerCase()}).`);
  lines.push(`El escenario base acumula ${forecast.totals.base} unidades (${forecast.goalCoverage.base} % de la meta), con un rango orientativo de ${forecast.totals.low} a ${forecast.totals.high}.`);
  if (forecast.probability !== null) lines.push(`La probabilidad aproximada de alcanzar la meta es de ${forecast.probability} %.`);
  lines.push(`Confianza de los datos: ${confidence.level.toLowerCase()}.`);

  const recommendations = [];
  if (forecast.goalCoverage.base < 100 && forecast.weeksToGoal) {
    const extension = forecast.weeksToGoal;
    recommendations.push(`Al ritmo actual la meta se alcanzaría en unas ${extension} semanas${forecast.completionDate ? ` (hacia el ${forecast.completionDate})` : ''}; también podría ajustarse la meta a cerca de ${forecast.totals.base} unidades.`);
  }
  if (coverage !== null && coverage < 100) recommendations.push(`La demanda pendiente de la categoría (${demand.pendingUnits} unidades) no queda cubierta con el ritmo proyectado: conviene reforzar la convocatoria.`);
  const gap = outlook.find(item => item.shortfall > 0 && normalize(item.category) !== normalize(scenario.category));
  if (gap) recommendations.push(`La categoría con mayor déficit proyectado es «${gap.category}» (${gap.shortfall} unidades por cubrir): podría priorizarse en la próxima campaña.`);
  if (confidence.level === 'Muy baja' || confidence.level === 'Baja') recommendations.push('Registrar donaciones de forma constante durante varias semanas mejorará la precisión de estas proyecciones.');
  return { source: 'automática', summary: lines.join(' '), recommendations: recommendations.slice(0, 4) };
}
