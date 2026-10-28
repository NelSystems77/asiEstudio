/** Fechas como 'YYYY-MM-DD' en hora local (evita desfases de zona horaria). */
const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export const isISODate = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());

export const addDays = (iso: string, n: number) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const daysBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);

export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(parseISO(iso));

export const formatLong = (iso: string) =>
  new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(parseISO(iso));
