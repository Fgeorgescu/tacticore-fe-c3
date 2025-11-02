/**
 * Utilidades para manejo de fechas y zonas horarias
 */

/**
 * Convierte una fecha ISO string del backend (UTC) a la zona horaria local del usuario
 * @param isoString - Fecha en formato ISO string desde el backend
 * @returns Date object en la zona horaria local
 */
export function parseBackendDate(isoString: string): Date {
  // El backend envía fechas en UTC, pero sin el 'Z' al final
  // Agregamos 'Z' para indicar explícitamente que es UTC
  const utcString = isoString.endsWith('Z') ? isoString : isoString + 'Z';
  return new Date(utcString);
}

/**
 * Calcula el tiempo relativo desde una fecha del backend
 * @param backendDateString - Fecha del backend en formato ISO
 * @returns String con el tiempo relativo (ej: "hace 2 horas")
 */
export function getRelativeTimeFromBackend(backendDateString: string): string {
  const backendDate = parseBackendDate(backendDateString);
  const now = new Date();
  const diffInMs = now.getTime() - backendDate.getTime();
  
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  } else if (diffInHours > 0) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInMinutes > 0) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  } else {
    return 'hace unos momentos';
  }
}

/**
 * Formatea una fecha del backend para mostrar en la UI
 * @param backendDateString - Fecha del backend en formato ISO
 * @returns String formateado para mostrar (ej: "24 Sep 2025, 12:30")
 */
export function formatBackendDate(backendDateString: string): string {
  const date = parseBackendDate(backendDateString);
  return date.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Obtiene información de debug sobre las fechas (útil para desarrollo)
 * @param backendDateString - Fecha del backend en formato ISO
 * @returns Objeto con información de debug
 */
export function debugDateInfo(backendDateString: string) {
  const backendDate = parseBackendDate(backendDateString);
  const now = new Date();
  
  return {
    backendString: backendDateString,
    parsedDate: backendDate.toISOString(),
    localDate: backendDate.toLocaleString(),
    now: now.toISOString(),
    nowLocal: now.toLocaleString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    diffInMs: now.getTime() - backendDate.getTime(),
    diffInHours: Math.floor((now.getTime() - backendDate.getTime()) / (1000 * 60 * 60))
  };
}
