import type { TaskView } from "../types";

type Props = { goal: string; requirements: string[]; stack: Record<string, string>; tasks: TaskView[] };

export default function PlanPanel({ goal, requirements, stack, tasks }: Props) {
  return (
    <div>
      <p className="text-sm text-ink/60">Goal</p>
      <p className="font-medium leading-snug">{goal}</p>

      <p className="text-sm text-ink/60 mt-4">Requirements</p>
      <ul className="list-disc ml-5 mt-1 text-sm space-y-0.5">{requirements.map((r) => <li key={r}>{r}</li>)}</ul>

      {Object.keys(stack).length > 0 && (
        <>
          <p className="text-sm text-ink/60 mt-4">Tech stack</p>
          <dl className="mt-1 text-sm space-y-0.5">
            {Object.entries(stack).map(([k, v]) => (
              <div key={k} className="flex gap-2"><dt className="font-medium capitalize w-20 shrink-0">{k}</dt><dd className="text-ink/80">{v}</dd></div>
            ))}
          </dl>
        </>
      )}

      <p className="text-sm text-ink/60 mt-4">Steps</p>
      <ol className="mt-2 space-y-3">
        {tasks.map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
              t.status === "done" ? (t.drifted ? "bg-warn border-warn" : "bg-ontrack border-ontrack") : "border-ink/30"}`} />
            <div>
              <p className={t.status === "done" ? "font-medium" : "text-ink/70"}>{t.title}</p>
              {t.summary ? <p className="text-sm text-ink/60">{t.summary}</p> : <p className="text-sm text-ink/45">{t.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
