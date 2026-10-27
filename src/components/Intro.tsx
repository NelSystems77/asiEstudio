import { useStore } from '../store';

export default function Intro() {
  const { exam, setExam, start } = useStore();
  const valid = exam.days >= 1 && exam.hoursPerDay >= 0.5;
  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-extrabold tracking-tight">Descubre cómo estudias mejor</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        5 minutos, 17 preguntas y 2 mini-retos. Obtendrás tu perfil de aprendizaje y un plan de estudio a la medida para tu examen.
      </p>
      <form className="card mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) start(); }}>
        <label className="block">
          <span className="text-sm font-medium">¿Qué examen preparas? (opcional)</span>
          <input className="input mt-1" value={exam.name} maxLength={60} placeholder="Ej. Cálculo I"
            onChange={(e) => setExam({ name: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Días que faltan</span>
            <input className="input mt-1" type="number" inputMode="numeric" min={1} max={60} value={exam.days}
              onChange={(e) => setExam({ days: Math.max(1, Math.min(60, Number(e.target.value) || 1)) })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Horas por día</span>
            <input className="input mt-1" type="number" inputMode="decimal" min={0.5} max={10} step={0.5} value={exam.hoursPerDay}
              onChange={(e) => setExam({ hoursPerDay: Math.max(0.5, Math.min(10, Number(e.target.value) || 0.5)) })} />
          </label>
        </div>
        <button className="btn-primary w-full" disabled={!valid}>Comenzar diagnóstico</button>
      </form>
      <p className="mt-4 text-xs text-slate-500">Tus respuestas se guardan solo en este dispositivo. Esta herramienta es orientativa y no reemplaza una evaluación profesional.</p>
    </div>
  );
}
