import { useEffect, useMemo, useRef, useState } from 'react';

const SHAPES = ['●', '■', '▲', '◆'];
const TOTAL = 5;

interface Item { pattern: string[]; options: string[]; answer: string }

function makeItem(): Item {
  // Patrón cíclico de 2 o 3 símbolos; hay que elegir el que sigue.
  const n = Math.random() < 0.5 ? 2 : 3;
  const base = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, n);
  const pattern = Array.from({ length: n * 2 }, (_, i) => base[i % n]);
  const answer = base[(n * 2) % n];
  return { pattern, options: [...SHAPES].sort(() => Math.random() - 0.5), answer };
}

/** Selección de patrones lógicos con medición de tiempo de reacción. */
export default function PatternGame({
  onDone,
}: { onDone: (r: { correct: number; total: number; meanRtMs: number }) => void }) {
  const items = useMemo(() => Array.from({ length: TOTAL }, makeItem), []);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const rts = useRef<number[]>([]);
  const t0 = useRef(performance.now());
  useEffect(() => { t0.current = performance.now(); }, [i]);

  const pick = (s: string) => {
    rts.current.push(performance.now() - t0.current);
    const c = correct + (s === items[i].answer ? 1 : 0);
    setCorrect(c);
    if (i + 1 >= TOTAL) {
      const mean = rts.current.reduce((a, b) => a + b, 0) / rts.current.length;
      onDone({ correct: c, total: TOTAL, meanRtMs: Math.round(mean) });
    } else setI(i + 1);
  };

  const it = items[i];
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold">Mini-reto: patrones lógicos</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        ¿Qué símbolo continúa la serie? Responde con rapidez y precisión. ({i + 1}/{TOTAL})
      </p>
      <div key={i} className="mt-6 flex animate-slide-in items-center justify-center gap-3 text-4xl" aria-label="Serie">
        {it.pattern.map((s, k) => <span key={k}>{s}</span>)}
        <span className="rounded-lg border-2 border-dashed border-brand-500 px-3 text-brand-500">?</span>
      </div>
      <div className="mx-auto mt-8 grid max-w-xs grid-cols-4 gap-3">
        {it.options.map((s) => (
          <button key={s} className="btn-ghost !px-0 text-3xl" onClick={() => pick(s)} aria-label={`Opción ${s}`}>{s}</button>
        ))}
      </div>
    </div>
  );
}
