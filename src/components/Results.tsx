import { useEffect, useMemo, useState } from 'react';
import matrix from '../data/matrix.json';
import { selectCurrent, useStore } from '../store';
import { computeProfile, dimensions, rankedChannels } from '../engine/scoring';
import { generatePlan, totalMinutes } from '../engine/plan';
import { formatDay, formatLong, todayISO } from '../engine/dates';
import type { ArchetypeId, ChannelId } from '../engine/types';
import Radar from './Radar';

type ArchetypeData = typeof matrix.archetypes.visual;
const archetypes = matrix.archetypes as Record<ArchetypeId, ArchetypeData>;
const modifiers = matrix.modifiers;

function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}%</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all duration-700 ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Results() {
  const rec = useStore(selectCurrent);
  const { goto, progress, toggle } = useStore();
  const [tab, setTab] = useState<'perfil' | 'plan'>('perfil');
  const profile = useMemo(() => (rec ? computeProfile(rec.answers, rec.games) : null), [rec]);
  const plan = useMemo(
    () => (rec && profile ? generatePlan(profile, { days: rec.days, hoursPerDay: rec.exam.hoursPerDay, startDate: rec.startDate }) : null),
    [rec, profile],
  );
  // Al imprimir, los días colapsados deben quedar abiertos.
  useEffect(() => {
    const openAll = () => document.querySelectorAll('details').forEach((d) => { d.open = true; });
    window.addEventListener('beforeprint', openAll);
    return () => window.removeEventListener('beforeprint', openAll);
  }, []);
  if (!rec || !profile || !plan) {
    return (
      <div className="card text-center">
        <p>No hay un diagnóstico seleccionado.</p>
        <button className="btn-primary mt-4" onClick={() => goto('intro')}>Hacer diagnóstico</button>
      </div>
    );
  }
  const { games, exam } = rec;
  const done = progress[rec.id] ?? {};
  const focusTotal = plan.days.reduce((n, d) => n + d.blocks.filter((b) => b.kind === 'focus').length, 0);
  const focusDone = Object.keys(done).length;
  const today = todayISO();
  const a = archetypes[profile.archetype];
  const m = profile.modifiers;
  const tips = [
    m.lowAttention && modifiers.lowAttention, m.highAttention && modifiers.highAttention,
    m.lowOrganization && modifiers.lowOrganization, m.highAnxiety && modifiers.highAnxiety,
  ].filter(Boolean) as { title: string; tips: string[] }[];
  const secondary = rankedChannels(profile.pct)[1] as ChannelId;
  const tone = (g: string) => (g === 'canal' ? 'bg-brand-600' : g === 'ejecutiva' ? 'bg-emerald-500' : 'bg-amber-500');

  return (
    <div className="animate-fade-up">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-6 text-white">
        <p className="text-sm opacity-80">Tu arquetipo de aprendizaje</p>
        <h1 className="mt-1 text-3xl font-extrabold">{a.name}</h1>
        <p className="mt-1 opacity-90">{a.tagline}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl print:hidden bg-slate-200 p-1 dark:bg-slate-800" role="tablist">
        {(['perfil', 'plan'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`min-h-[44px] rounded-lg font-semibold transition ${tab === t ? 'bg-white shadow dark:bg-slate-950' : 'text-slate-500'}`}>
            {t === 'perfil' ? 'Mi perfil' : 'Plan a la medida'}
          </button>
        ))}
      </div>

      {tab === 'perfil' ? (
        <div className="mt-4 space-y-4">
          <section className="card"><Radar axes={dimensions.map((d) => ({ label: d.label, value: profile.pct[d.id] }))} /></section>
          <section className="card space-y-3">
            <h2 className="font-bold">Puntuaciones</h2>
            {dimensions.map((d) => <Bar key={d.id} label={d.label} value={profile.pct[d.id]} tone={tone(d.group)} />)}
            {games.pattern && (
              <p className="pt-1 text-xs text-slate-500">
                Reto de patrones: {games.pattern.correct}/{games.pattern.total} aciertos · {games.pattern.meanRtMs} ms promedio.
              </p>
            )}
          </section>
          <section className="card">
            <p className="text-slate-600 dark:text-slate-300">{a.description}</p>
            <h3 className="mt-4 font-bold">Fortalezas</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">{a.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            <h3 className="mt-4 font-bold">A cuidar</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">{a.watchouts.map((s) => <li key={s}>{s}</li>)}</ul>
            <h3 className="mt-4 font-bold">Técnicas recomendadas</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {a.techniques.map((t) => <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700 dark:bg-brand-700/30 dark:text-brand-100">{t}</span>)}
            </div>
            {profile.archetype !== 'multimodal' && (
              <p className="mt-4 text-sm text-slate-500">Canal secundario: <b>{dimensions.find((d) => d.id === secondary)?.label}</b>. Úsalo para reforzar lo que ya estudiaste por tu canal principal.</p>
            )}
          </section>
          {tips.map((t) => (
            <section key={t.title} className="card">
              <h3 className="font-bold">{t.title}</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">{t.tips.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {exam.name ? <b>{exam.name} · </b> : null}examen el {formatLong(exam.examDate)} · {plan.days.length} día(s) desde {formatDay(rec.startDate)} · bloques de {plan.focusMinutes} min + {plan.breakMinutes} min de pausa.
          </p>
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Progreso del plan</span><span>{focusDone}/{focusTotal} bloques</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-label="Progreso del plan" aria-valuenow={focusDone} aria-valuemin={0} aria-valuemax={focusTotal}>
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${focusTotal ? (focusDone / focusTotal) * 100 : 0}%` }} />
            </div>
          </div>
          {plan.days.map((d) => {
            const dayDone = d.blocks.reduce((n, b, k) => n + (b.kind === 'focus' && done[`${d.day}:${k}`] ? 1 : 0), 0);
            const dayFocus = d.blocks.filter((b) => b.kind === 'focus').length;
            const isToday = d.date === today;
            return (
              <details key={d.day} open={isToday || (d.date > today && d.day === 1)} className={`card group ${isToday ? 'ring-2 ring-brand-500' : ''}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      {formatDay(d.date)} · Día {d.day} · {Math.round(totalMinutes(d))} min
                      {isToday && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-white">Hoy</span>}
                    </p>
                    <p className="font-bold">{d.phaseTitle} <span className="text-xs font-normal text-slate-500">{dayDone}/{dayFocus}</span></p>
                  </div>
                  <span className="transition group-open:rotate-90" aria-hidden>›</span>
                </summary>
                <p className="mt-2 text-sm italic text-slate-500">{d.goal}</p>
                <ol className="mt-3 space-y-2">
                  {d.blocks.map((b, k) => {
                    const key = `${d.day}:${k}`;
                    const tone = b.kind === 'focus' ? 'bg-brand-50 dark:bg-brand-700/20' : b.kind === 'calm' ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-100 dark:bg-slate-800';
                    return (
                      <li key={k} className={`rounded-lg text-sm ${tone}`}>
                        {b.kind === 'focus' ? (
                          <label className="flex min-h-[44px] cursor-pointer gap-3 p-3">
                            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" checked={!!done[key]} onChange={() => toggle(rec.id, key)} />
                            <span className={done[key] ? 'line-through opacity-60' : ''}><b>{b.minutes}′</b> · {b.text}</span>
                          </label>
                        ) : (
                          <div className="flex gap-3 p-3"><span className="w-5 shrink-0 text-center" aria-hidden>{b.kind === 'calm' ? '🧘' : '☕'}</span><span><b>{b.minutes}′</b> · {b.text}</span></div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </details>
            );
          })}
          <button className="btn-ghost w-full print:hidden" onClick={() => window.print()}>Imprimir / guardar como PDF</button>
        </div>
      )}

      <button className="btn-ghost mt-6 w-full print:hidden" onClick={() => goto('intro')}>Nuevo diagnóstico</button>
    </div>
  );
}
