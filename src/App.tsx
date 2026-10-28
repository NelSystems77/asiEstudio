import { useEffect } from 'react';
import { useStore } from './store';
import Header from './components/Header';
import Intro from './components/Intro';
import Quiz from './components/Quiz';
import Results from './components/Results';
import History from './components/History';
import About from './components/About';

export default function App() {
  const screen = useStore((s) => s.screen);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-12 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Header />
      {screen === 'intro' && <Intro />}
      {screen === 'quiz' && <Quiz />}
      {screen === 'results' && <Results />}
      {screen === 'history' && <History />}
      {screen === 'about' && <About />}
    </main>
  );
}
