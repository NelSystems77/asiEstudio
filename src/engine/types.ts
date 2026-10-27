export type DimId =
  | 'visual' | 'auditivo' | 'lectoescritura' | 'kinestesico'
  | 'atencion' | 'organizacion' | 'ansiedad';
export type ChannelId = 'visual' | 'auditivo' | 'lectoescritura' | 'kinestesico';
export type ArchetypeId = ChannelId | 'multimodal';

export interface Option { label: string; weights: Partial<Record<DimId, number>> }
export interface Question { id: string; category: string; text: string; options: Option[] }

export interface GameResults {
  sequence?: number; // rondas correctas (0..3)
  pattern?: { correct: number; total: number; meanRtMs: number };
}

export interface Answers { [questionId: string]: number } // índice de opción elegida

export interface Modifiers {
  lowAttention: boolean;
  highAttention: boolean;
  lowOrganization: boolean;
  highAnxiety: boolean;
}

export interface Profile {
  raw: Record<DimId, number>;
  max: Record<DimId, number>;
  pct: Record<DimId, number>; // 0..100
  archetype: ArchetypeId;
  modifiers: Modifiers;
}

export interface ExamSetup { name: string; days: number; hoursPerDay: number }

export type PhaseId = 'mapeo' | 'aprendizaje' | 'recuperacion' | 'simulacro' | 'final';

export interface PlanBlock { minutes: number; kind: 'focus' | 'break' | 'calm'; text: string }
export interface PlanDay {
  day: number;
  phase: PhaseId;
  phaseTitle: string;
  goal: string;
  blocks: PlanBlock[];
}
export interface StudyPlan {
  focusMinutes: number;
  breakMinutes: number;
  days: PlanDay[];
}
