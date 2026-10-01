from fastapi import FastAPI
from pydantic import BaseModel

from drift import MODEL_PATH, detect_drift

app = FastAPI(title="Aegis ML")


class DriftReq(BaseModel):
    goal: str
    requirements: list[str]
    checkpoints: list[str]
    task_text: str


def plain(o):
    if isinstance(o, dict):
        return {k: plain(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [plain(v) for v in o]
    return o.item() if hasattr(o, "item") else o


@app.get("/health")
def health():
    return {"drift_model": "trained" if MODEL_PATH.exists() else "heuristic"}


@app.post("/drift")
def drift(req: DriftReq):
    return plain(detect_drift(req.goal, req.requirements, req.checkpoints, req.task_text))