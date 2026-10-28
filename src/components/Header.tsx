import { useStore } from '../store';
import { useInstall, useTheme } from '../hooks';

const BASE = import.meta.env.BASE_URL;
const ICON = { system: '🖥️', light: '☀️', dark: '🌙' } as const;
const LABEL = { system: 'Tema: automático', light: 'Tema: claro', dark: 'Tema: oscuro' } as const;

export default function Header() {
  const { screen, goto, history } = useStore();
  const { theme, cycle } = useTheme();
  const install = useInstall();
  const link = (s: 'history' | 'about', text: string) => (
    <button
      onClick={() => goto(s)}
      aria-current={screen === s ? 'page' : undefined}
      className={`min-h-[44px] rounded-lg px-3 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 ${screen === s ? 'text-brand-600' : ''}`}
    >{text}</button>
  );
  return (
    <header className="mb-6 flex items-center justify-between gap-1 print:hidden">
      <button onClick={() => goto(screen === 'quiz' ? 'quiz' : 'intro')} className="flex min-h-[44px] items-center gap-2 font-bold text-brand-600">
        <img src={`${BASE}icon.svg`} alt="" className="h-7 w-7 rounded-lg" /> asiEstudio
      </button>
      <nav className="flex items-center" aria-label="Principal">
        {install && <button onClick={install} className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-brand-600">Instalar</button>}
        {history.length > 0 && link('history', 'Historial')}
        {link('about', 'Acerca de')}
        <button onClick={cycle} aria-label={LABEL[theme]} title={LABEL[theme]} className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">{ICON[theme]}</button>
      </nav>
    </header>
  );
}
