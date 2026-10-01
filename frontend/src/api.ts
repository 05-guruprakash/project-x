import type { Health, Plan, StepResult, Summary } from "./types";
const BASE = import.meta.env.VITE_API ?? "http://localhost:8000";

async function call<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    let detail = "";
    try { detail = (await r.json()).detail ?? ""; } catch { /* ignore */ }
    throw new Error(detail || `${path} failed (${r.status})`);
  }
  return r.json();
}
export const getHealth = () => call<Health>("/health");
export const makePlan = (idea: string) => call<Plan>("/plan", { idea });
export const runStep = (project_id: string, force_drift: boolean) => call<StepResult>("/step", { project_id, force_drift });
export const getSummary = (id: string) => call<Summary>(`/summary/${id}`);
