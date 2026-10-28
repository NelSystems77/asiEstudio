export type DimId =
  | 'visual' | 'auditivo' | 'lectoescritura' | 'kinestesico'
  | 'atencion' | 'organizacion' | 'ansiedad';
export type ChannelId = 'visual' | 'auditivo' | 'lectoescritura' | 'kinestesico';
export type ArchetypeId = ChannelId | 'multimodal';

export interface Option { label: string; weights: Partial<Record<DimId, number>> }
export interface Question { id: string; category: string; text: string; options: Option[] }

export type GameId = 'sequence' | 'pattern';

export interface GameResults {
  sequence?: number; // rondas correctas (0..3)
  pattern?: { correct: number; total: number; meanRtMs: number };
  /** Retos omitidos: se excluyen del cálculo (no penalizan el puntaje). */
  skipped?: GameId[];
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

export interface ExamSetup { name: string; examDate: string; hoursPerDay: number }

/** Diagnóstico guardado. El perfil y el plan se recalculan siempre desde `answers` + `games`. */
export interface AssessmentRecord {
  id: string;
  createdAt: string; // ISO datetime
  matrixVersion: string;
  exam: ExamSetup;
  startDate: string; // primer día del plan
  days: number;
  answers: Answers;
  games: GameResults;
}

export type PhaseId = 'mapeo' | 'aprendizaje' | 'recuperacion' | 'simulacro' | 'final';

export interface PlanBlock { minutes: number; kind: 'focus' | 'break' | 'calm'; text: string }
export interface PlanDay {
  day: number;
  date: string; // YYYY-MM-DD
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
