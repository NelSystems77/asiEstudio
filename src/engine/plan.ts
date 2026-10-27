import matrix from '../data/matrix.json';
import { rankedChannels } from './scoring';
import type { ChannelId, ExamSetup, PhaseId, PlanBlock, PlanDay, Profile, StudyPlan } from './types';

type PlaybookEntry = { title: string; goal: string; general: string[] } & Record<ChannelId, string[]>;
const playbook = matrix.playbook as unknown as Record<PhaseId, PlaybookEntry>;

export const MAX_PLAN_DAYS = 60;

export function phaseForDay(i: number, total: number): PhaseId {
  if (total === 1) return 'simulacro';
  if (i === total - 1) return 'final';
  if (total === 2) return 'recuperacion';
  if (i === 0) return 'mapeo';
  const f = i / total;
  if (f < 0.5) return 'aprendizaje';
  if (f < 0.8) return 'recuperacion';
  return 'simulacro';
}

export function blockLengths(p: Profile): { focus: number; rest: number } {
  if (p.modifiers.lowAttention) return { focus: 20, rest: 5 };
  if (p.modifiers.highAttention) return { focus: 40, rest: 10 };
  return { focus: 25, rest: 5 };
}

export function generatePlan(profile: Profile, exam: ExamSetup): StudyPlan {
  const { focus, rest } = blockLengths(profile);
  const total = Math.max(1, Math.min(MAX_PLAN_DAYS, Math.floor(exam.days)));
  const channels = profile.archetype === 'multimodal'
    ? rankedChannels(profile.pct)
    : [profile.archetype as ChannelId, ...rankedChannels(profile.pct).filter((c) => c !== profile.archetype)];

  const days: PlanDay[] = [];
  for (let i = 0; i < total; i++) {
    const phase = phaseForDay(i, total);
    const pb = playbook[phase];
    // Si es el último día, o hay ansiedad alta, se alivia la carga.
    const hours = phase === 'final' ? Math.min(exam.hoursPerDay, 1.5) : exam.hoursPerDay;
    const slots = Math.max(1, Math.floor((hours * 60) / (focus + rest)));

    // Actividades: se rota el canal; multimodal rota por bloque, los demás priorizan su canal.
    const pool: string[] = [];
    channels.forEach((c) => pool.push(...pb[c]));
    pool.push(...pb.general);
    const channelPool = profile.archetype === 'multimodal'
      ? pool
      : [...pb[channels[0]], ...pb.general, ...pb[channels[1]]];

    const blocks: PlanBlock[] = [];
    if (profile.modifiers.highAnxiety) blocks.push({ minutes: 2, kind: 'calm', text: matrix.calming.before });
    for (let s = 0; s < slots; s++) {
      const text = channelPool[(s + i) % channelPool.length];
      blocks.push({ minutes: focus, kind: 'focus', text });
      if (s < slots - 1) {
        blocks.push({
          minutes: rest, kind: 'break',
          text: profile.modifiers.highAnxiety ? matrix.calming.after : 'Pausa breve: levántate, hidrátate, mira lejos',
        });
      }
    }
    if (profile.modifiers.lowOrganization) {
      blocks.push({ minutes: 3, kind: 'calm', text: 'Cierre: anota qué harás mañana y a qué hora empiezas' });
    }
    days.push({ day: i + 1, phase, phaseTitle: pb.title, goal: pb.goal, blocks });
  }
  return { focusMinutes: focus, breakMinutes: rest, days };
}

export const totalMinutes = (d: PlanDay) =>
  d.blocks.reduce((n, b) => n + b.minutes, 0);
