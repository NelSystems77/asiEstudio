import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import matrix from './data/matrix.json';
import { addDays, todayISO } from './engine/dates';
import { parseExport, type Progress } from './engine/io';
import { planWindow } from './engine/plan';
import type { Answers, AssessmentRecord, ExamSetup, GameId, GameResults } from './engine/types';

export type Screen = 'intro' | 'quiz' | 'results' | 'history' | 'about';
export const flow = matrix.flow as string[];
const isGame = (s: string) => s.startsWith('game:');

export const defaultExam = (): ExamSetup => ({ name: '', examDate: addDays(todayISO(), 14), hoursPerDay: 2 });
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

interface State {
  screen: Screen;
  step: number;
  draft: { exam: ExamSetup; answers: Answers; games: GameResults };
  history: AssessmentRecord[];
  currentId: string | null;
  progress: Progress;
  goto: (s: Screen) => void;
  setExam: (e: Partial<ExamSetup>) => void;
  start: () => void;
  answer: (qid: string, idx: number) => void;
  setGame: (id: GameId, result: GameResults) => void;
  skipGame: (id: GameId) => void;
  next: () => void;
  back: () => void;
  open: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string, key: string) => void;
  importData: (text: string) => number | null;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      screen: 'intro',
      step: 0,
      draft: { exam: defaultExam(), answers: {}, games: {} },
      history: [],
      currentId: null,
      progress: {},
      goto: (screen) => set({ screen }),
      setExam: (e) => set({ draft: { ...get().draft, exam: { ...get().draft.exam, ...e } } }),
      start: () => set({ screen: 'quiz', step: 0, draft: { ...get().draft, answers: {}, games: {} } }),
      answer: (qid, idx) => set({ draft: { ...get().draft, answers: { ...get().draft.answers, [qid]: idx } } }),
      setGame: (_id, result) => set({ draft: { ...get().draft, games: { ...get().draft.games, ...result } } }),
      skipGame: (id) => {
        const g = get().draft.games;
        set({ draft: { ...get().draft, games: { ...g, skipped: [...new Set([...(g.skipped ?? []), id])] } } });
      },
      next: () => {
        const { step, draft, history } = get();
        if (step + 1 < flow.length) return set({ step: step + 1 });
        const { startDate, days } = planWindow(todayISO(), draft.exam.examDate);
        const rec: AssessmentRecord = {
          id: newId(), createdAt: new Date().toISOString(), matrixVersion: matrix.version,
          exam: draft.exam, startDate, days, answers: draft.answers, games: draft.games,
        };
        set({ history: [rec, ...history], currentId: rec.id, screen: 'results' });
      },
      // Retrocede a la pregunta anterior (los mini-retos no se repiten).
      back: () => {
        let s = get().step - 1;
        while (s > 0 && isGame(flow[s])) s--;
        set({ step: Math.max(0, s) });
      },
      open: (id) => set({ currentId: id, screen: 'results' }),
      remove: (id) => {
        const { [id]: _drop, ...progress } = get().progress;
        const history = get().history.filter((r) => r.id !== id);
        set({ history, progress, currentId: get().currentId === id ? null : get().currentId });
      },
      toggle: (id, key) => {
        const cur = get().progress[id] ?? {};
        const next = { ...cur };
        if (next[key]) delete next[key]; else next[key] = true;
        set({ progress: { ...get().progress, [id]: next } });
      },
      importData: (text) => {
        const parsed = parseExport(text);
        if (!parsed) return null;
        const known = new Set(get().history.map((r) => r.id));
        const fresh = parsed.records.filter((r) => !known.has(r.id));
        set({
          history: [...get().history, ...fresh].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          progress: { ...parsed.progress, ...get().progress },
        });
        return fresh.length;
      },
    }),
    {
      name: 'asiestudio',
      version: 2,
      // v1 (MVP) guardaba otro formato sin historial: se descarta y se parte limpio.
      migrate: () => ({}) as never,
    },
  ),
);

export const selectCurrent = (s: State) => s.history.find((r) => r.id === s.currentId) ?? null;
