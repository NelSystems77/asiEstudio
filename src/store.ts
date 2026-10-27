import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import matrix from './data/matrix.json';
import type { Answers, ExamSetup, GameResults } from './engine/types';

export type Screen = 'intro' | 'quiz' | 'results';
export const flow = matrix.flow as string[];

interface State {
  screen: Screen;
  step: number;
  exam: ExamSetup;
  answers: Answers;
  games: GameResults;
  setExam: (e: Partial<ExamSetup>) => void;
  start: () => void;
  answer: (qid: string, idx: number) => void;
  setGame: (g: Partial<GameResults>) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const initial = {
  screen: 'intro' as Screen,
  step: 0,
  exam: { name: '', days: 14, hoursPerDay: 2 },
  answers: {} as Answers,
  games: {} as GameResults,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setExam: (e) => set({ exam: { ...get().exam, ...e } }),
      start: () => set({ screen: 'quiz', step: 0, answers: {}, games: {} }),
      answer: (qid, idx) => set({ answers: { ...get().answers, [qid]: idx } }),
      setGame: (g) => set({ games: { ...get().games, ...g } }),
      next: () => {
        const step = get().step + 1;
        set(step >= flow.length ? { screen: 'results' } : { step });
      },
      back: () => set({ step: Math.max(0, get().step - 1) }),
      reset: () => set({ ...initial, exam: get().exam }),
    }),
    { name: 'asiestudio-v1' },
  ),
);
