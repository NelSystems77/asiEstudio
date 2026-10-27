import { describe, expect, it } from 'vitest';
import matrix from '../data/matrix.json';
import { computeProfile, maxScores, pickArchetype, questions } from './scoring';
import { generatePlan, phaseForDay } from './plan';
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
    const plan = generatePlan(profile, { name: 'X', days: 10, hoursPerDay: 2 });
    expect(plan.days).toHaveLength(10);
    expect(plan.days[0].phase).toBe('mapeo');
    expect(plan.days[9].phase).toBe('final');
  });
  it('1 día => simulacro; sin días negativos', () => {
    expect(phaseForDay(0, 1)).toBe('simulacro');
    expect(generatePlan(profile, { name: 'X', days: 0, hoursPerDay: 1 }).days).toHaveLength(1);
  });
  it('ansiedad alta añade ritual de calma', () => {
    const p = computeProfile(pick('ansiedad'), {});
    expect(p.modifiers.highAnxiety).toBe(true);
    const plan = generatePlan(p, { name: 'X', days: 3, hoursPerDay: 1 });
    expect(plan.days[0].blocks[0].kind).toBe('calm');
  });
});
