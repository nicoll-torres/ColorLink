/**
 * Utilidades para normalización y comparación estricta de Ciudades Principales
 * en la plataforma ColorLink Pintuco.
 */

export function normalizeCityName(cityName?: string): string {
  if (!cityName) return '';
  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s*d\.?c\.?\s*/gi, '') // Quitar D.C.
    .replace(/[^a-z0-9]/g, '')       // Quitar espacios y puntuaciones
    .trim();
}

/**
 * Compara si dos ciudades corresponden a la misma Ciudad principal
 * (ej. "Bogotá" === "Bogotá D.C.", "Medellín" === "Medellín / Rionegro", "Cali" === "Cali")
 */
export function isSameCity(cityA?: string, cityB?: string): boolean {
  if (!cityA || !cityB) return false;
  const nA = normalizeCityName(cityA);
  const nB = normalizeCityName(cityB);
  if (!nA || !nB) return false;
  return nA.includes(nB) || nB.includes(nA);
}

/**
 * Formatea el nombre visual canónico de la ciudad principal
 */
export function getCanonicalCityName(city?: string): string {
  if (!city) return 'Medellín';
  const norm = normalizeCityName(city);
  if (norm.includes('bogota')) return 'Bogotá D.C.';
  if (norm.includes('medellin') || norm.includes('rionegro')) return 'Medellín';
  if (norm.includes('cali') || norm.includes('yumbo')) return 'Cali';
  if (norm.includes('barranquilla')) return 'Barranquilla';
  if (norm.includes('bucaramanga')) return 'Bucaramanga';
  return city;
}
