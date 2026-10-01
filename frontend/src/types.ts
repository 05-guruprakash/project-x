export type Status = "todo" | "doing" | "done";

export type Busy = "plan" | "step" | "open" | null;

export interface Task {
  title: string;
  description: string;
  status: Status;
  issue_url?: string;
}

export interface Snippet {
  label: string;
  lang: string;
  code: string;
}

export interface SubStep {
  title: string;
  detail: string;
  done: boolean;
}

export interface ChatMsg {
  role: "user" | "agent";
  text: string;
  at: number;
}

export interface QA {
  q: string;
  a: string;
}

export interface Question {
  question: string;
  multi: boolean;
  options: {
    label: string;
    detail?: string;
  }[];
}

export interface Discovery {
  done: boolean;
  question?: Question;
}

export interface Guide {
  summary: string;
  how_to: string[];
  backend: string[];
  frontend: string[];
  data: string[];
  done_when: string[];

  why?: string;
  explanation?: string;
  tools?: string[];

  substeps?: {
    title: string;
    detail: string;
  }[];

  snippets?: Snippet[];

  verify?: string[];
  pitfalls?: string[];
}

export interface StepRecord {
  title: string;
  summary: string;
  guide: Guide;
  substeps?: SubStep[];
  chat?: ChatMsg[];
}

export interface Drift {
  drifting: boolean;
  missed_requirement?: string;
  probability?: number;
  drift_probability?: number;
  drift_prob?: number;
  prob?: number;
  alignment_score?: number;
  [key: string]: unknown;
}

export interface Change {
  text: string;
  verdict: "scope_creep" | "on_track";
  drift: Drift;
  advice: string | null;
  at: number;
}

export interface ChatUpdate {
  substeps?: {
    title: string;
    detail: string;
  }[];
  new_task?: {
    title: string;
    description: string;
  };
}

export interface Plan {
  goal: string;
  requirements: string[];
  tech_stack: Record<string, string>;
  tasks: Task[];
}

export interface Project {
  project_id: string;
  idea: string;
  goal: string;
  requirements: string[];
  tech_stack: Record<string, string>;
  tasks: Task[];
  steps: StepRecord[];
  idx: number;
  interventions: number;
  changes: Change[];
  checkpoints?: string[];
  context?: QA[];
  done: boolean;
}

export interface ProjectSummary {
  project_id: string;
  title: string;
  updated_at: number;
  done: number;
  total: number;
}

export interface StepResult {
  task_idx: number;
  task_title: string;
  guide: Guide;
  checkpoint: string;
  original_checkpoint: string | null;
  drift: Drift;
  intervention: string | null;
  drift_after: Drift | null;
  done: boolean;
}

export interface Memory {
  experience: string;
  preferred_stack: string;
  notes: string;
}

export interface ChatReply {
  reply: string;
  kind: "help" | "change";
  update?: ChatUpdate;
}

export interface GithubResult {
  created: {
    title: string;
    url: string;
  }[];
  error: string | null;
}

export interface Health {
  llm: {
    mode: string;
    model: string | null;
  };
  drift_model: string;
}