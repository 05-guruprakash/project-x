import type { Change, GithubResult, Health, Memory, Project, Discovery,QA, ProjectSummary, Status, StepResult } from "./types";

const BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const KEY = "aegis_user_id";

function userId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

interface Init {
  method?: string;
  body?: unknown;
}

async function call(path: string, init: Init = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      headers: { "Content-Type": "application/json", "X-User-Id": userId() },
    });
  } catch {
    throw new Error("Cannot reach the server. Is the API running on port 8000?");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const m = data?.message;
    throw new Error(Array.isArray(m) ? m.join("; ") : (m ?? `Request failed (${res.status})`));
  }
  return res;
}

async function json<T>(path: string, init?: Init): Promise<T> {
  return (await call(path, init)).json() as Promise<T>;
}

export const api = {
  health: () => json<Health>("/health"),
  projects: () => json<ProjectSummary[]>("/projects"),
  project: (id: string) => json<Project>(`/projects/${id}`),
  remove: (id: string) => json<{ ok: boolean }>(`/projects/${id}`, { method: "DELETE" }),
  plan: (idea: string) => json<Project>("/plan", { method: "POST", body: { idea } }),
  step: (project_id: string, force_drift: boolean) =>
    json<StepResult>("/step", { method: "POST", body: { project_id, force_drift } }),
  setStatus: (id: string, idx: number, status: Status) =>
    json<{ done: number; total: number }>(`/projects/${id}/tasks/${idx}/status`, { method: "PUT", body: { status } }),
  logChange: (id: string, text: string) =>
    json<Change>(`/projects/${id}/changes`, { method: "POST", body: { text } }),
  github: (id: string, repo: string, token: string) =>
    json<GithubResult>(`/projects/${id}/github/issues`, { method: "POST", body: { repo, token } }),
  memory: () => json<Memory>("/memory"),
  saveMemory: (m: Memory) => json<Memory>("/memory", { method: "PUT", body: m }),
  discover: (
  idea: string,
  answers: QA[],
) =>
  json<Discovery>(
    "/discover",
    {
      method: "POST",
      body: {
        idea,
        answers,
      },
    },
  ),

create: (
  idea: string,
  answers: QA[],
) =>
  json<Project>(
    "/projects",
    {
      method: "POST",
      body: {
        idea,
        answers,
      },
    },
  ),

toggleSub: (
  id: string,
  idx: number,
  subIndex: number,
) =>
  json<Project>(
    `/projects/${id}/steps/${idx}/substeps/${subIndex}`,
    {
      method: "PUT",
    },
  ),

chat: (
  id: string,
  idx: number,
  message: string,
) =>
  json<Project>(
    `/projects/${id}/steps/${idx}/chat`,
    {
      method: "POST",
      body: {
        message,
      },
    },
    ),
};

export async function downloadSpec(id: string): Promise<void> {
  const blob = await (await call(`/projects/${id}/export`)).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aegis-${id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}