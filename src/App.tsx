import { useStore } from './store';
import Intro from './components/Intro';
import Quiz from './components/Quiz';
import Results from './components/Results';

export default function App() {
  const screen = useStore((s) => s.screen);
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-12 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-center gap-2 font-bold text-brand-600">
        <img src="/icon.svg" alt="" className="h-7 w-7 rounded-lg" /> asiEstudio
      </header>
      {screen === 'intro' && <Intro />}
      {screen === 'quiz' && <Quiz />}
      {screen === 'results' && <Results />}
    </main>
  );
}
