import { useEffect, useRef, useState } from "react";
import { getHealth, getSummary, makePlan, runStep } from "./api";
import type { Drift, Guide, Health, Msg, Plan, StepResult, Summary, TaskView } from "./types";
import DriftMeter from "./components/DriftMeter";
import GuideCard from "./components/GuideCard";
import InterventionBanner from "./components/InterventionBanner";
import PlanPanel from "./components/PlanPanel";
import { downloadText, planToMarkdown } from "./lib/markdown";

export default function App() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [drift, setDrift] = useState<Drift | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forceNext, setForceNext] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const say = (role: Msg["role"], text: string, guide?: Guide) => setMsgs((m) => [...m, { role, text, guide }]);

  async function submitIdea() {
    const idea = input.trim();
    if (!idea || busy) return;
    setInput(""); setBusy(true); say("user", idea);
    setPlan(null); setSummary(null); setFinished(false); setDrift(null); setHistory([]);
    try {
      const p = await makePlan(idea);
      setPlan(p);
      setTasks(p.tasks.map((t) => ({ ...t, status: "pending" })));
      say("aegis", `Plan ready: ${p.tasks.length} steps covering ${p.requirements.length} requirements. Each step gets a detailed guide (how-to, endpoints, screens, data). Run the next step, or run them all.`);
    } catch (e) { say("alert", `Could not create a plan: ${(e as Error).message}`); }
    setBusy(false);
  }

  function apply(r: StepResult) {
    setTasks((ts) => ts.map((t, i) => i === r.task_idx ? { ...t, status: "done", summary: r.guide.summary, drifted: !!r.intervention } : t));
    setDrift(r.drift_after ?? r.drift);
    setHistory((h) => [...h, r.drift.alignment]);
    const n = r.task_idx + 1;
    if (r.intervention) {
      say("aegis", `Step ${n}: ${r.task_title}. The first draft went off track: "${r.original_checkpoint}"`);
      say("alert", `Drift detected (alignment ${Math.round(r.drift.alignment * 100)}%). ${r.intervention}`);
      say("aegis", `Step ${n} re-planned: ${r.task_title}`, r.guide);
      setBanner(r.intervention);
    } else {
      say("aegis", `Step ${n}: ${r.task_title}`, r.guide);
    }
  }

  async function finish() {
    if (!plan) return;
    setFinished(true);
    const s = await getSummary(plan.project_id);
    setSummary(s);
    say("aegis", `Project plan complete. ${s.summary}`);
  }

  async function step(force = false) {
    if (!plan || busy || finished) return;
    setBusy(true);
    try {
      const r = await runStep(plan.project_id, force);
      apply(r);
      if (r.done) await finish();
    } catch (e) { say("alert", (e as Error).message); }
    setBusy(false);
  }

  async function runAll() {
    if (!plan || busy || finished) return;
    setBusy(true);
    try {
      for (;;) {
        const r = await runStep(plan.project_id, false);
        apply(r);
        if (r.done) { await finish(); break; }
        await new Promise((res) => setTimeout(res, 500));
      }
    } catch (e) { say("alert", (e as Error).message); }
    setBusy(false);
  }

  const canRun = !!plan && !busy && !finished;

  return (
    <div className="h-screen grid md:grid-cols-[1fr_420px]">
      {banner && <InterventionBanner text={banner} onClose={() => setBanner(null)} />}

      <main className="flex flex-col min-h-0">
        <header className="px-6 py-4 border-b border-ink/15">
          <h1 className="text-xl font-semibold">Aegis</h1>
          <p className="text-sm text-ink/60">Describe a project. Aegis plans it step by step and keeps every step on goal.</p>
          <p className="text-xs text-ink/50 mt-1">
            {health ? `LLM: ${health.llm.model ?? "mock"} · Drift model: ${health.drift_model === "trained" ? "trained classifier" : "similarity heuristic"}`
                    : "Backend not reachable on port 8000"}
          </p>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {msgs.length === 0 && <p className="text-ink/50">Try: “Build an online banking app with React and Node, include every API endpoint”.</p>}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`${m.guide ? "w-full max-w-[92%]" : "max-w-[80%]"} rounded-lg px-3 py-2 text-[15px] leading-relaxed ${
                m.role === "user" ? "bg-ink text-white" : m.role === "alert" ? "bg-warn/15 border border-warn text-ink" : "bg-white border border-ink/10"}`}>
                <p className={m.guide ? "font-semibold" : ""}>{m.text}</p>
                {m.guide && <GuideCard guide={m.guide} />}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="px-6 py-4 border-t border-ink/15 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitIdea()}
                 placeholder="Describe your project idea" className="flex-1 rounded-lg border border-ink/20 bg-white px-3 py-2 focus:outline-2 focus:outline-ink" />
          <button onClick={submitIdea} disabled={busy || !input.trim()} className="rounded-lg bg-ink text-white px-4 py-2 disabled:opacity-40">Create plan</button>
        </div>
      </main>

      <aside className="border-l border-ink/15 bg-white/60 overflow-y-auto px-6 py-5 space-y-6">
        {plan ? (
          <>
            <PlanPanel goal={plan.goal} requirements={plan.requirements} stack={plan.tech_stack} tasks={tasks} />
            <DriftMeter drift={drift} history={history} />
            <div className="space-y-2">
              <div className="flex gap-2">
                <button onClick={() => { step(forceNext); setForceNext(false); }} disabled={!canRun}
                        className="flex-1 rounded-lg bg-ink text-white px-3 py-2 disabled:opacity-40">Run next step</button>
                <button onClick={runAll} disabled={!canRun} className="flex-1 rounded-lg border border-ink px-3 py-2 disabled:opacity-40">Run all</button>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input type="checkbox" checked={forceNext} onChange={(e) => setForceNext(e.target.checked)} />
                Make the planner wander off on the next step (demo)
              </label>
            </div>
            {summary && (
              <div className="border-t border-ink/15 pt-4">
                <p className="font-semibold">Final plan</p>
                <p className="text-sm mt-1">{summary.summary}</p>
                <p className="text-sm text-ink/60 mt-2">{summary.interventions} drift intervention{summary.interventions === 1 ? "" : "s"} during planning.</p>
                <button onClick={() => downloadText("project-plan.md", planToMarkdown(summary))}
                        className="mt-3 rounded-lg bg-ink text-white px-3 py-2 text-sm">Download full plan (.md)</button>
              </div>
            )}
          </>
        ) : <p className="text-ink/50">Your plan, tech stack, progress and alignment will show up here.</p>}
      </aside>
    </div>
  );
}
