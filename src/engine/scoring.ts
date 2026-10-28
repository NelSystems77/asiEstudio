import matrix from '../data/matrix.json';
import type {
  Answers, ArchetypeId, ChannelId, DimId, GameId, GameResults, Modifiers, Profile, Question,
} from './types';

export const questions = matrix.questions as Question[];
export const dimensions = matrix.dimensions as { id: DimId; label: string; group: string }[];
const T = matrix.thresholds;
const CHANNELS = matrix.tieBreakOrder as ChannelId[];

const zero = (): Record<DimId, number> =>
  Object.fromEntries(dimensions.map((d) => [d.id, 0])) as Record<DimId, number>;

/** Puntos de cada minijuego (0..maxPoints) */
export function gamePoints(g: GameResults) {
  const seq = Math.min(g.sequence ?? 0, matrix.games.sequence.maxPoints);
  const pat = g.pattern
    ? Math.round((matrix.games.pattern.maxPoints * g.pattern.correct) / Math.max(1, g.pattern.total))
    : 0;
  return { sequence: seq, pattern: pat };
}

/** Máximos posibles por dimensión (preguntas + minijuegos no omitidos). */
export function maxScores(skipped: GameId[] = []): Record<DimId, number> {
  const max = zero();
  for (const q of questions) {
    for (const d of dimensions) {
      const m = Math.max(0, ...q.options.map((o) => o.weights[d.id] ?? 0));
      max[d.id] += m;
    }
  }
  for (const [id, g] of Object.entries(matrix.games)) {
    if (skipped.includes(id as GameId)) continue;
    for (const d of g.dims) max[d as DimId] += g.maxPoints;
  }
  return max;
}

export function computeProfile(answers: Answers, games: GameResults): Profile {
  const raw = zero();
  for (const q of questions) {
    const idx = answers[q.id];
    const opt = idx === undefined ? undefined : q.options[idx];
    if (!opt) continue;
    for (const [dim, w] of Object.entries(opt.weights)) raw[dim as DimId] += w ?? 0;
  }
  const skipped = games.skipped ?? [];
  const gp = gamePoints(games);
  if (!skipped.includes('sequence')) for (const d of matrix.games.sequence.dims) raw[d as DimId] += gp.sequence;
  if (!skipped.includes('pattern')) for (const d of matrix.games.pattern.dims) raw[d as DimId] += gp.pattern;

  const max = maxScores(skipped);
  const pct = zero();
  for (const d of dimensions) pct[d.id] = max[d.id] ? Math.round((raw[d.id] / max[d.id]) * 100) : 0;

  return { raw, max, pct, archetype: pickArchetype(pct), modifiers: pickModifiers(pct) };
}

export function pickArchetype(pct: Record<DimId, number>): ArchetypeId {
  // Orden estable: mayor puntaje, empate resuelto por tieBreakOrder.
  const ranked = [...CHANNELS].sort((a, b) => pct[b] - pct[a] || CHANNELS.indexOf(a) - CHANNELS.indexOf(b));
  const [first, second] = ranked;
  return pct[first] - pct[second] <= T.multimodalGap ? 'multimodal' : first;
}

export function pickModifiers(pct: Record<DimId, number>): Modifiers {
  return {
    lowAttention: pct.atencion < T.attentionLow,
    highAttention: pct.atencion >= T.attentionHigh,
    lowOrganization: pct.organizacion < T.organizationLow,
    highAnxiety: pct.ansiedad >= T.anxietyHigh,
  };
}

/** Canales ordenados de mayor a menor (con desempate estable). */
export function rankedChannels(pct: Record<DimId, number>): ChannelId[] {
  return [...CHANNELS].sort((a, b) => pct[b] - pct[a] || CHANNELS.indexOf(a) - CHANNELS.indexOf(b));
}
