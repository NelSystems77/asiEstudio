import { useCallback, useEffect, useRef, useState } from 'react';

const COLORS = ['bg-rose-500', 'bg-sky-500', 'bg-amber-400', 'bg-emerald-500'];
const ROUNDS = [4, 5, 6];

/** Memoria de secuencia visual: 3 rondas (4,5,6 elementos). Resultado: rondas correctas (0..3). */
export default function SequenceGame({ onDone }: { onDone: (correctRounds: number) => void }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'show' | 'input' | 'feedback'>('ready');
  const [lit, setLit] = useState<number | null>(null);
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [lastOk, setLastOk] = useState(true);
  const timers = useRef<number[]>([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  const play = useCallback((r: number) => {
    const s = Array.from({ length: ROUNDS[r] }, () => Math.floor(Math.random() * 4));
    setSeq(s); setInput([]); setPhase('show');
    s.forEach((v, i) => {
      timers.current.push(window.setTimeout(() => setLit(v), 600 + i * 800));
      timers.current.push(window.setTimeout(() => setLit(null), 600 + i * 800 + 500));
    });
    timers.current.push(window.setTimeout(() => setPhase('input'), 600 + s.length * 800));
  }, []);

  const tap = (i: number) => {
    if (phase !== 'input') return;
    const next = [...input, i];
    setInput(next);
    if (seq[next.length - 1] !== i || next.length === seq.length) {
      const ok = next.every((v, k) => v === seq[k]) && next.length === seq.length;
      const total = score + (ok ? 1 : 0);
      setScore(total); setPhase('feedback');
      timers.current.push(window.setTimeout(() => {
        if (round + 1 >= ROUNDS.length) onDone(total);
        else { setRound(round + 1); play(round + 1); }
      }, 900));
      setLastOk(ok);
    }
  };
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold">Mini-reto: memoria de secuencia</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Observa el orden en que se iluminan los cuadros y repítelo. Ronda {round + 1} de {ROUNDS.length}.
      </p>
      <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3" role="group" aria-label="Cuadros de colores">
        {COLORS.map((c, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            disabled={phase !== 'input'}
            aria-label={`Cuadro ${i + 1}`}
            className={`aspect-square rounded-2xl text-3xl font-bold text-white transition ${c} ${lit === i ? 'scale-105 opacity-100 ring-4 ring-white' : 'opacity-40'} ${phase === 'input' ? 'opacity-80 active:opacity-100' : ''}`}
          >{['①', '②', '③', '④'][i]}</button>
        ))}
      </div>
      <p className="mt-4 h-6 text-sm font-medium" aria-live="polite">
        {phase === 'show' && 'Observa…'}
        {phase === 'input' && `Tu turno (${input.length}/${seq.length})`}
        {phase === 'feedback' && (lastOk ? '¡Correcto!' : 'Casi — sigamos')}
      </p>
      {phase === 'ready' && (
        <button className="btn-primary mt-4" onClick={() => play(0)}>Comenzar</button>
      )}
    </div>
  );
}
