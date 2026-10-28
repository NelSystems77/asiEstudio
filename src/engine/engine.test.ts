import { describe, expect, it } from 'vitest';
import matrix from '../data/matrix.json';
import { computeProfile, maxScores, pickArchetype, questions } from './scoring';
import { generatePlan, phaseForDay, planWindow } from './plan';
import { addDays, daysBetween, isISODate } from './dates';
import { buildExport, parseExport } from './io';
import type { Answers, DimId } from './types';

const pick = (dim: DimId): Answers =>
  Object.fromEntries(
    questions.map((q) => {
      let best = 0, bw = -1;
      q.options.forEach((o, i) => { const w = o.weights[dim] ?? 0; if (w > bw) { bw = w; best = i; } });
      return [q.id, best];
    }),
  );

describe('matriz', () => {
  it('el flujo referencia sólo preguntas existentes y las cubre todas', () => {
    const ids = new Set(questions.map((q) => q.id));
    const flowQ = matrix.flow.filter((s) => !s.startsWith('game:'));
    expect(new Set(flowQ)).toEqual(ids);
  });
  it('todo peso refiere a una dimensión válida', () => {
    const dims = new Set(matrix.dimensions.map((d) => d.id));
    for (const q of questions) for (const o of q.options) for (const k of Object.keys(o.weights)) expect(dims.has(k as DimId)).toBe(true);
  });
});

describe('scoring', () => {
  it('es determinista', () => {
    const a = pick('visual');
    expect(computeProfile(a, {})).toEqual(computeProfile(a, {}));
  });
  it.each(['visual', 'auditivo', 'lectoescritura', 'kinestesico'] as const)('arquetipo %s', (c) => {
    const p = computeProfile(pick(c), {});
    expect(p.archetype).toBe(c);
    expect(p.pct[c]).toBe(Math.round((p.raw[c] / p.max[c]) * 100));
  });
  it('porcentajes nunca superan 100', () => {
    const p = computeProfile(pick('atencion'), { sequence: 3, pattern: { correct: 5, total: 5, meanRtMs: 500 } });
    for (const v of Object.values(p.pct)) expect(v).toBeLessThanOrEqual(100);
    expect(p.pct.atencion).toBe(100);
    expect(maxScores().atencion).toBeGreaterThan(0);
  });
  it('multimodal cuando los canales están parejos', () => {
    expect(pickArchetype({ visual: 50, auditivo: 48, lectoescritura: 30, kinestesico: 20 } as never)).toBe('multimodal');
  });
  it('empates se resuelven por orden fijo', () => {
    expect(pickArchetype({ visual: 70, auditivo: 40, lectoescritura: 40, kinestesico: 40 } as never)).toBe('visual');
  });
});

describe('plan', () => {
  const profile = computeProfile({ ...pick('kinestesico'), ...pick('ansiedad') , q1: 3 }, {});
  it('cubre exactamente los días pedidos y termina en repaso final', () => {
    const plan = generatePlan(profile, { days: 10, hoursPerDay: 2, startDate: '2026-11-01' });
    expect(plan.days).toHaveLength(10);
    expect(plan.days[0].phase).toBe('mapeo');
    expect(plan.days[9].phase).toBe('final');
  });
  it('1 día => simulacro; sin días negativos', () => {
    expect(phaseForDay(0, 1)).toBe('simulacro');
    expect(generatePlan(profile, { days: 0, hoursPerDay: 1, startDate: '2026-11-01' }).days).toHaveLength(1);
  });
  it('ansiedad alta añade ritual de calma', () => {
    const p = computeProfile(pick('ansiedad'), {});
    expect(p.modifiers.highAnxiety).toBe(true);
    const plan = generatePlan(p, { days: 3, hoursPerDay: 1, startDate: '2026-11-01' });
    expect(plan.days[0].blocks[0].kind).toBe('calm');
  });
});

describe('retos omitidos', () => {
  it('omitir un reto no penaliza el porcentaje', () => {
    const a = pick('atencion');
    const perfect = computeProfile(a, { sequence: 3, pattern: { correct: 5, total: 5, meanRtMs: 400 } });
    const skipped = computeProfile(a, { skipped: ['sequence', 'pattern'] });
    expect(skipped.pct.atencion).toBe(perfect.pct.atencion);
    expect(skipped.max.atencion).toBeLessThan(perfect.max.atencion);
  });
  it('ignora puntos de un reto marcado como omitido', () => {
    const a = pick('visual');
    const p = computeProfile(a, { sequence: 3, skipped: ['sequence'] });
    expect(p.raw.visual).toBe(computeProfile(a, { skipped: ['sequence'] }).raw.visual);
  });
});

describe('fechas y ventana del plan', () => {
  it('aritmética de días sin desfases', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(isISODate('2026-02-30')).toBe(true); // Date normaliza; el formato es lo que se valida
    expect(isISODate('26-1-1')).toBe(false);
  });
  it('examen mañana => 1 día; hoy => 1 día', () => {
    expect(planWindow('2026-10-28', '2026-10-29')).toEqual({ startDate: '2026-10-28', days: 1 });
    expect(planWindow('2026-10-28', '2026-10-28').days).toBe(1);
  });
  it('examen lejano => últimos 60 días terminando el día previo', () => {
    const w = planWindow('2026-01-01', '2026-12-31');
    expect(w.days).toBe(60);
    expect(addDays(w.startDate, w.days)).toBe('2026-12-31');
  });
  it('el plan asigna fechas consecutivas', () => {
    const p = computeProfile(pick('visual'), {});
    const plan = generatePlan(p, { days: 3, hoursPerDay: 1, startDate: '2026-10-30' });
    expect(plan.days.map((d) => d.date)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });
});

describe('export/import', () => {
  const rec = {
    id: 'a1', createdAt: '2026-10-28T10:00:00.000Z', matrixVersion: matrix.version,
    exam: { name: 'Cálculo', examDate: '2026-11-10', hoursPerDay: 2 }, startDate: '2026-10-28', days: 13,
    answers: pick('visual'), games: { sequence: 2 },
  };
  it('ida y vuelta', () => {
    const out = parseExport(JSON.stringify(buildExport([rec], { a1: { '1:0': true } })));
    expect(out?.records[0]).toEqual(rec);
    expect(out?.progress).toEqual({ a1: { '1:0': true } });
  });
  it('rechaza basura y sanea valores fuera de rango', () => {
    expect(parseExport('no es json')).toBeNull();
    expect(parseExport(JSON.stringify({ app: 'otra' }))).toBeNull();
    const bad = { ...rec, answers: { q1: 99, q2: 1 }, exam: { ...rec.exam, hoursPerDay: 999 } };
    const out = parseExport(JSON.stringify({ app: 'asiestudio', version: 1, records: [bad, { id: 1 }] }));
    expect(out?.records).toHaveLength(1);
    expect(out?.records[0].answers).toEqual({ q2: 1 });
    expect(out?.records[0].exam.hoursPerDay).toBe(10);
  });
});
