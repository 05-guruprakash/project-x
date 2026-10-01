import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import llm
from drift import detect_drift, MODEL_PATH

app = FastAPI(title="Aegis")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

PROJECTS: dict[str, dict] = {}   # in-memory is fine for the demo
OFF_TOPIC = ["Set up an animated logo and marketing color themes for a promo page",
             "Research trending social media memes and viral content ideas",
             "Write a blog post about unrelated productivity tips"]
EMPTY = {"how_to": [], "backend": [], "frontend": [], "data": [], "done_when": []}

class PlanReq(BaseModel):
    idea: str

class StepReq(BaseModel):
    project_id: str
    force_drift: bool = False   # demo: the planner "wanders off" on this step

@app.get("/health")
def health():
    return {"llm": llm.status(), "drift_model": "trained" if MODEL_PATH.exists() else "heuristic"}

@app.post("/plan")
def plan(req: PlanReq):
    try:
        p = llm.make_plan(req.idea)
    except Exception as e:
        raise HTTPException(502, f"LLM error while planning: {e}")
    pid = uuid.uuid4().hex[:8]
    PROJECTS[pid] = {**p, "idx": 0, "checkpoints": [], "steps": [], "interventions": 0}
    return {"project_id": pid, **p}

@app.post("/step")
def step(req: StepReq):
    p = PROJECTS.get(req.project_id)
    if not p:
        raise HTTPException(404, "unknown project")
    if p["idx"] >= len(p["tasks"]):
        raise HTTPException(400, "project already finished")
    i, task = p["idx"], p["tasks"][p["idx"]]
    task_text = f"{task['title']}. {task['description']}"
    try:
        if req.force_drift:
            guide = {"summary": OFF_TOPIC[i % len(OFF_TOPIC)], **EMPTY}
        else:
            guide = llm.plan_step(p["goal"], p["requirements"], p["tech_stack"], task)
        cp = guide["summary"]                                   # checkpoint = 1-2 sentence summary only
        drift = detect_drift(p["goal"], p["requirements"], p["checkpoints"] + [cp], task_text)

        msg, original, drift_after = None, None, None
        if drift["drifting"]:
            msg = llm.intervention(p["goal"], drift["missed_requirement"])
            original = cp
            guide = llm.plan_step(p["goal"], p["requirements"], p["tech_stack"], task, nudge=msg)   # re-plan with feedback
            cp = guide["summary"]
            drift_after = detect_drift(p["goal"], p["requirements"], p["checkpoints"] + [cp], task_text)
            p["interventions"] += 1
    except Exception as e:
        raise HTTPException(502, f"LLM error during step: {e}")

    p["checkpoints"].append(cp)
    p["steps"].append({"title": task["title"], "summary": cp, "guide": guide})
    p["idx"] += 1
    return {"task_idx": i, "task_title": task["title"], "guide": guide, "checkpoint": cp,
            "original_checkpoint": original, "drift": drift, "intervention": msg,
            "drift_after": drift_after, "done": p["idx"] >= len(p["tasks"])}

@app.get("/summary/{pid}")
def summary(pid: str):
    p = PROJECTS.get(pid)
    if not p:
        raise HTTPException(404, "unknown project")
    try:
        text = llm.final_summary(p["goal"], p["steps"])
    except Exception as e:
        raise HTTPException(502, f"LLM error during summary: {e}")
    return {"goal": p["goal"], "requirements": p["requirements"], "tech_stack": p["tech_stack"],
            "steps": p["steps"], "interventions": p["interventions"], "summary": text}
