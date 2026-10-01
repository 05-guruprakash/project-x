import type { Drift } from "../types";

const pct = (n?: number) => (n === undefined ? "-" : `${Math.round(Math.max(0, n) * 100)}%`);

export default function DriftMeter({ drift, history }: { drift: Drift | null; history: number[] }) {
  const bad = drift?.drifting;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-medium">Goal alignment</span>
        <span className={bad ? "text-warn font-semibold" : "text-ontrack font-semibold"}>
          {drift ? (bad ? "Drifting" : "On track") : "Waiting for first step"}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-ink/10 overflow-hidden">
        <div className={`h-full transition-all duration-500 ${bad ? "bg-warn" : "bg-ontrack"}`} style={{ width: pct(drift?.alignment) }} />
      </div>
      <div className="mt-3 flex items-end gap-1 h-8" aria-label="Alignment per step">
        {history.map((a, i) => (
          <div key={i} title={`Step ${i + 1}: ${pct(a)}`}
               className={`w-3 rounded-sm ${a < 0.5 ? "bg-warn" : "bg-ontrack/70"}`} style={{ height: `${Math.max(a, 0.08) * 100}%` }} />
        ))}
      </div>
      {drift && (
        <div className="mt-3 text-sm text-ink/70 space-y-0.5">
          <p>Drift probability {pct(drift.drift_score)} · {drift.mode === "trained" ? "trained classifier" : "similarity heuristic"}</p>
          {drift.features && (
            <p>Matches: goal {pct(drift.features.sim_goal)}, requirement {pct(drift.features.best_req)}, task {pct(drift.features.sim_task)}</p>
          )}
        </div>
      )}
    </div>
  );
}
