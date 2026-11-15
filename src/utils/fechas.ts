/**
 * Formato único de fechas de la interfaz: DD/MM/AAAA (con HH:mm cuando lleva hora).
 * El backend recibe y devuelve ISO (AAAA-MM-DD); la conversión se hace solo acá.
 */

const SOLO_DIA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const TEXTO_DIA = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function dosDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Un AAAA-MM-DD se lee como día local (new Date lo tomaría como UTC y podría correrse un día). */
function aDate(valor: string | Date): Date {
  if (valor instanceof Date) return valor;
  const dia = SOLO_DIA_ISO.exec(valor);
  return dia ? new Date(Number(dia[1]), Number(dia[2]) - 1, Number(dia[3])) : new Date(valor);
}

/** DD/MM/AAAA. */
export function formatearFecha(valor: string | Date): string {
  const fecha = aDate(valor);
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/** DD-MM-AAAA para nombres de archivo, que no admiten "/". */
export function formatearFechaArchivo(valor: string | Date): string {
  return formatearFecha(valor).replaceAll('/', '-');
}

/** DD/MM/AAAA HH:mm. */
export function formatearFechaHora(valor: string | Date): string {
  const fecha = aDate(valor);
  return `${formatearFecha(fecha)} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

/** AAAA-MM-DD local: el formato que viaja al backend y que se compara entre fechas. */
export function diaIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** AAAA-MM-DD → DD/MM/AAAA ('' si viene vacío). */
export function isoATexto(iso: string): string {
  const dia = SOLO_DIA_ISO.exec(iso);
  return dia ? `${dia[3]}/${dia[2]}/${dia[1]}` : '';
}

/** DD/MM/AAAA → AAAA-MM-DD, o null si no es una fecha real (p. ej. 31/02/2026). */
export function textoAIso(texto: string): string | null {
  const partes = TEXTO_DIA.exec(texto);
  if (!partes) return null;
  const [, dd, mm, aaaa] = partes;
  const fecha = new Date(Number(aaaa), Number(mm) - 1, Number(dd));
  const valida =
    fecha.getFullYear() === Number(aaaa) && fecha.getMonth() === Number(mm) - 1 && fecha.getDate() === Number(dd);
  return valida ? `${aaaa}-${mm}-${dd}` : null;
}

/** Duración legible a partir de horas: "menos de 1 min", "45 min", "3 h 20 min", "2 d 4 h". */
export function formatearDuracion(horas: number | null): string {
  if (horas === null) return '—';
  const minutos = Math.round(horas * 60);
  if (minutos < 1) return 'menos de 1 min';
  if (minutos < 60) return `${minutos} min`;
  const totalHoras = Math.floor(minutos / 60);
  if (totalHoras < 24) {
    const resto = minutos % 60;
    return resto ? `${totalHoras} h ${resto} min` : `${totalHoras} h`;
  }
  const dias = Math.floor(totalHoras / 24);
  const restoHoras = totalHoras % 24;
  return restoHoras ? `${dias} d ${restoHoras} h` : `${dias} d`;
}
