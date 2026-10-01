"""Goal-drift detector.
Features per checkpoint (pretrained MiniLM embeddings, cosine sim):
  sim_goal  - checkpoint vs project goal
  best_req  - checkpoint vs its closest requirement
  sim_task  - checkpoint vs the task it was supposed to do
If drift_model.joblib exists (made by train_drift.py) a trained LogisticRegression scores drift;
otherwise a weighted-similarity heuristic with threshold ALIGN_MIN is used."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env", override=True)
from sentence_transformers import SentenceTransformer, util

ALIGN_MIN = float(os.getenv("ALIGN_MIN", "0.30"))   # heuristic mode threshold
DRIFT_P = float(os.getenv("DRIFT_P", "0.5"))        # trained mode threshold
MODEL_PATH = Path(__file__).parent / "drift_model.joblib"
_enc, _clf, _clf_tried = None, None, False

def _m():
    global _enc
    if _enc is None:
        _enc = SentenceTransformer("all-MiniLM-L6-v2")
    return _enc

def _classifier():
    global _clf, _clf_tried
    if not _clf_tried:
        _clf_tried = True
        if MODEL_PATH.exists():
            import joblib
            _clf = joblib.load(MODEL_PATH)
    return _clf

def features(goal: str, requirements: list[str], checkpoint: str, task_text: str) -> list[float]:
    m = _m()
    c = m.encode(checkpoint, convert_to_tensor=True)
    sim_goal = util.cos_sim(m.encode(goal, convert_to_tensor=True), c).item()
    best_req = util.cos_sim(c, m.encode(requirements, convert_to_tensor=True)).max().item()
    sim_task = util.cos_sim(m.encode(task_text, convert_to_tensor=True), c).item()
    return [sim_goal, best_req, sim_task]

def detect_drift(goal: str, requirements: list[str], checkpoints: list[str], task_text: str | None = None) -> dict:
    m = _m()
    f = features(goal, requirements, checkpoints[-1], task_text or goal)
    clf = _classifier() if task_text else None
    if clf is not None:
        p = float(clf.predict_proba([f])[0][1])
        alignment, drifting, mode = 1 - p, p >= DRIFT_P, "trained"
    else:
        alignment = max(0.0, min(1.0, 0.4 * f[0] + 0.3 * f[1] + 0.3 * f[2]))
        drifting, mode = alignment < ALIGN_MIN, "heuristic"

    # requirement this step SHOULD have advanced (closest to the task), else the least-covered one
    if task_text:
        sims = util.cos_sim(m.encode(task_text, convert_to_tensor=True), m.encode(requirements, convert_to_tensor=True))[0]
        missed = requirements[int(sims.argmax())]
    else:
        cover = util.cos_sim(m.encode(requirements, convert_to_tensor=True),
                             m.encode(checkpoints, convert_to_tensor=True)).max(dim=1).values
        missed = requirements[int(cover.argmin())]

    return {"alignment": round(alignment, 3), "drift_score": round(1 - alignment, 3), "drifting": bool(drifting),
            "missed_requirement": missed, "mode": mode,
            "features": {"sim_goal": round(f[0], 3), "best_req": round(f[1], 3), "sim_task": round(f[2], 3)}}