import { useRef, useState } from 'react';
import { useStore } from '../store';
import matrix from '../data/matrix.json';
import { computeProfile } from '../engine/scoring';
import { buildExport } from '../engine/io';
import { formatLong } from '../engine/dates';
import type { ArchetypeId } from '../engine/types';

const archetypes = matrix.archetypes as Record<ArchetypeId, { name: string }>;

export default function History() {
  const { history, progress, open, remove, importData, goto } = useStore();
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(buildExport(history, progress), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `asiestudio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const onImport = async (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) return setMsg('El archivo es demasiado grande.');
    const n = importData(await f.text());
    setMsg(n === null ? 'Archivo no válido: no es una copia de asiEstudio.' : `Se importaron ${n} diagnóstico(s).`);
    if (file.current) file.current.value = '';
  };

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-extrabold">Historial</h1>
      <p className="mt-1 text-sm text-slate-500">Guardado solo en este dispositivo. Exporta una copia para pasarla a otro.</p>
      <ul className="mt-4 space-y-3">
        {history.map((r) => {
          const p = computeProfile(r.answers, r.games);
          return (
            <li key={r.id} className="card flex items-center justify-between gap-3">
              <button className="flex-1 text-left" onClick={() => open(r.id)}>
                <p className="font-bold">{archetypes[p.archetype].name}</p>
                <p className="text-sm text-slate-500">{r.exam.name || 'Sin nombre'} · examen {formatLong(r.exam.examDate)}</p>
                <p className="text-xs text-slate-400">Realizado {formatLong(r.createdAt.slice(0, 10))}</p>
              </button>
              <button className="btn-ghost !min-h-[44px] !px-3 text-sm" aria-label="Eliminar diagnóstico"
                onClick={() => { if (confirm('¿Eliminar este diagnóstico y su progreso?')) remove(r.id); }}>🗑</button>
            </li>
          );
        })}
        {history.length === 0 && <li className="card text-center text-slate-500">Aún no hay diagnósticos.</li>}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="btn-ghost" onClick={download} disabled={!history.length}>Exportar</button>
        <button className="btn-ghost" onClick={() => file.current?.click()}>Importar</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
      </div>
      <p className="mt-3 text-sm" role="status">{msg}</p>
      <button className="btn-primary mt-4 w-full" onClick={() => goto('intro')}>Nuevo diagnóstico</button>
    </div>
  );
}
