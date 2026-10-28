import matrix from '../data/matrix.json';
import { isISODate } from './dates';
import type { AssessmentRecord, GameId } from './types';
import { questions } from './scoring';

export type Progress = Record<string, Record<string, boolean>>;
export interface ExportFile { app: 'asiestudio'; version: 1; matrixVersion: string; records: AssessmentRecord[]; progress: Progress }

export const buildExport = (records: AssessmentRecord[], progress: Progress): ExportFile => ({
  app: 'asiestudio', version: 1, matrixVersion: matrix.version, records, progress,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined;

/** Valida y sanea un registro importado; devuelve null si no es utilizable. */
export function sanitizeRecord(r: unknown): AssessmentRecord | null {
  if (!isObj(r) || typeof r.id !== 'string' || !r.id || r.id.length > 64) return null;
  if (!isObj(r.exam) || !isObj(r.answers) || !isObj(r.games)) return null;
  const hours = num(r.exam.hoursPerDay, 0.5, 10);
  const days = num(r.days, 1, 60);
  if (hours === undefined || days === undefined || !isISODate(r.exam.examDate) || !isISODate(r.startDate)) return null;
  if (typeof r.createdAt !== 'string' || Number.isNaN(Date.parse(r.createdAt))) return null;

  const answers: Record<string, number> = {};
  for (const q of questions) {
    const a = r.answers[q.id];
    if (typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < q.options.length) answers[q.id] = a;
  }
  const g = r.games;
  const games: AssessmentRecord['games'] = {};
  const seq = num(g.sequence, 0, matrix.games.sequence.maxPoints);
  if (seq !== undefined) games.sequence = Math.round(seq);
  if (isObj(g.pattern)) {
    const total = num(g.pattern.total, 1, 20), correct = num(g.pattern.correct, 0, 20), rt = num(g.pattern.meanRtMs, 0, 600_000);
    if (total !== undefined && correct !== undefined && rt !== undefined)
      games.pattern = { total, correct: Math.min(correct, total), meanRtMs: rt };
  }
  if (Array.isArray(g.skipped)) games.skipped = g.skipped.filter((x): x is GameId => x === 'sequence' || x === 'pattern');

  return {
    id: r.id, createdAt: r.createdAt, matrixVersion: typeof r.matrixVersion === 'string' ? r.matrixVersion : 'unknown',
    exam: { name: typeof r.exam.name === 'string' ? r.exam.name.slice(0, 60) : '', examDate: r.exam.examDate, hoursPerDay: hours },
    startDate: r.startDate, days: Math.round(days), answers, games,
  };
}

export function parseExport(text: string): { records: AssessmentRecord[]; progress: Progress } | null {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return null; }
  if (!isObj(data) || data.app !== 'asiestudio' || data.version !== 1 || !Array.isArray(data.records)) return null;
  const records = data.records.map(sanitizeRecord).filter((r): r is AssessmentRecord => r !== null);
  const progress: Progress = {};
  if (isObj(data.progress)) {
    for (const rec of records) {
      const p = data.progress[rec.id];
      if (!isObj(p)) continue;
      progress[rec.id] = Object.fromEntries(Object.entries(p).filter(([k, v]) => /^\d+:\d+$/.test(k) && v === true).map(([k]) => [k, true]));
    }
  }
  return { records, progress };
}
