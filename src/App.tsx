import { TimersProvider, useTimers } from "./store/TimersContext";
import { TimerGrid } from "./components/TimerGrid";
import { CommandBar } from "./components/CommandBar";
import { ClockDisplay } from "./components/ClockDisplay";
import { useAudio } from "./hooks/useAudio";

function Header() {
  const { timers, dispatch } = useTimers();
  const running = timers.filter((t) => t.status === "running").length;
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex flex-1 min-w-0 items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-violet-600 grid place-items-center font-bold">
            ⏱️
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-none text-zinc-100">
              Timer Grid
            </h1>
            <p className="text-xs text-zinc-500">
              {timers.length} timers • {running} running
            </p>
          </div>
        </div>
        <div className="flex shrink-0 justify-center">
          <ClockDisplay />
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => dispatch({ type: "PAUSE_ALL" })}
            className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            Pause All
          </button>
          <button
            onClick={() => dispatch({ type: "START_ALL" })}
            className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            Start All
          </button>
          <button
            onClick={() => dispatch({ type: "CLEAR_FINISHED" })}
            className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            Clear Finished
          </button>
        </div>
      </div>
    </header>
  );
}

function AppInner() {
  const audio = useAudio();
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl pb-40">
        <TimerGrid audio={audio} />
      </main>
      <CommandBar />
    </div>
  );
}

export default function App() {
  return (
    <TimersProvider>
      <AppInner />
    </TimersProvider>
  );
}
