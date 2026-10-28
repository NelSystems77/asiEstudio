import { flow, useStore } from '../store';
import { questions } from '../engine/scoring';
import SequenceGame from '../games/SequenceGame';
import PatternGame from '../games/PatternGame';

export default function Quiz() {
  const { step, draft, answer, next, back, setGame, skipGame } = useStore();
  const id = flow[step];
  const pct = Math.round((step / flow.length) * 100);
  const q = questions.find((x) => x.id === id);
  const qNum = flow.slice(0, step + 1).filter((s) => !s.startsWith('game:')).length;
  const qTotal = flow.filter((s) => !s.startsWith('game:')).length;

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>{q ? `Pregunta ${qNum} de ${qTotal}` : 'Mini-reto'}</span><span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar" aria-label="Progreso del diagnóstico" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-600 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div key={id} className="animate-slide-in">
        {q ? (
          <>
            <h2 className="text-xl font-bold leading-snug">{q.text}</h2>
            <div className="mt-5 space-y-3" role="radiogroup" aria-label={q.text}>
              {q.options.map((o, i) => {
                const sel = draft.answers[q.id] === i;
                return (
                  <button key={i} role="radio" aria-checked={sel}
                    onClick={() => { answer(q.id, i); setTimeout(next, 220); }}
                    className={`w-full rounded-xl border-2 p-4 text-left transition active:scale-[.99] ${sel
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-700/20'
                      : 'border-slate-200 bg-white hover:border-brand-500 dark:border-slate-800 dark:bg-slate-900'}`}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </>
        ) : id === 'game:sequence' ? (
          <>
            <SequenceGame onDone={(n) => { setGame('sequence', { sequence: n }); next(); }} />
            <button className="btn-ghost mx-auto mt-6 flex" onClick={() => { skipGame('sequence'); next(); }}>Omitir este reto</button>
          </>
        ) : (
          <>
            <PatternGame onDone={(r) => { setGame('pattern', { pattern: r }); next(); }} />
            <button className="btn-ghost mx-auto mt-6 flex" onClick={() => { skipGame('pattern'); next(); }}>Omitir este reto</button>
          </>
        )}
      </div>

      {step > 0 && q && <button className="btn-ghost mt-6" onClick={back}>← Anterior</button>}
    </div>
  );
}
