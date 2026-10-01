export type Drift = {
  alignment: number; drift_score: number; drifting: boolean; missed_requirement: string;
  mode?: string; features?: { sim_goal: number; best_req: number; sim_task: number };
};
export type Guide = { summary: string; how_to: string[]; backend: string[]; frontend: string[]; data: string[]; done_when: string[] };
export type Plan = {
  project_id: string; goal: string; requirements: string[]; tech_stack: Record<string, string>;
  tasks: { title: string; description: string }[];
};
export type StepResult = {
  task_idx: number; task_title: string; guide: Guide; checkpoint: string; original_checkpoint: string | null;
  drift: Drift; intervention: string | null; drift_after: Drift | null; done: boolean;
};
export type Summary = {
  goal: string; requirements: string[]; tech_stack: Record<string, string>; summary: string; interventions: number;
  steps: { title: string; summary: string; guide: Guide }[];
};
export type Msg = { role: "user" | "aegis" | "alert"; text: string; guide?: Guide };
export type TaskView = { title: string; description: string; status: "pending" | "done"; summary?: string; drifted?: boolean };
export type Health = { llm: { mode: string; model: string | null; reason: string }; drift_model: string };
