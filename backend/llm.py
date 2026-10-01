"""Groq LLM wrapper for Aegis (project PLANNER: it guides, it does not pretend to build).
Reads backend/.env. Fails LOUDLY (no silent mock) unless MOCK_LLM=true."""
import os, json, re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env", override=True)

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip().strip('"\'')
_forced_mock = os.getenv("MOCK_LLM", "false").lower() == "true"
_has_key = bool(os.getenv("GROQ_API_KEY", "").strip())
MOCK = _forced_mock or not _has_key
_reason = "MOCK_LLM=true" if _forced_mock else ("GROQ_API_KEY missing (is .env in backend/ and named exactly '.env'?)" if not _has_key else "")
print(f"[Aegis] LLM mode: {'MOCK - ' + _reason if MOCK else 'GROQ (' + MODEL + ')'}")

def status() -> dict:
    return {"mode": "mock" if MOCK else "groq", "model": None if MOCK else MODEL, "reason": _reason}

_client = None
def _ask(prompt: str, max_tokens: int = 600, json_mode: bool = False) -> str:
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq(api_key=os.environ["GROQ_API_KEY"].strip())
    kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
    budget = max_tokens
    if "gpt-oss" in MODEL.lower():
        budget = max_tokens + 2500                       # reasoning tokens count toward the limit
        kwargs["extra_body"] = {"reasoning_effort": "low"}
    r = _client.chat.completions.create(
        model=MODEL, max_tokens=budget, temperature=0.4,
        messages=[{"role": "user", "content": prompt}], **kwargs)
    out = (r.choices[0].message.content or "").strip()
    if not out:
        raise RuntimeError(f"Model returned empty output (finish_reason={r.choices[0].finish_reason})")
    return out

def _json(txt: str) -> dict:
    m = re.search(r"\{.*\}", txt, re.S)
    if not m:
        raise ValueError("No JSON found in model output")
    return json.loads(m.group(0))

def _s(x) -> str:
    if isinstance(x, dict):
        return " - ".join(str(v) for v in x.values() if str(v).strip())
    return str(x).strip()

def _list(v) -> list[str]:
    return [t for t in (_s(x) for x in v) if t] if isinstance(v, list) else []

def _pick(d: dict, *keys):
    for k in keys:
        if d.get(k):
            return d[k]
    return None

# ---------------------------------------------------------------- planning
def _mock_plan(idea: str) -> dict:
    steps = [("Design the database schema", "Define tables, relations and storage"),
             ("Build backend API endpoints", "Create REST endpoints for core features"),
             ("Implement authentication", "Add signup, login and access control"),
             ("Build the frontend interface", "Create the main user-facing screens"),
             ("Test and deploy", "Write tests and deploy the app")]
    return {"goal": idea,
            "requirements": ["Database schema and storage", "Backend API endpoints",
                             "User authentication", "Frontend user interface", "Testing and deployment"],
            "tech_stack": {"frontend": "React + Vite + TypeScript", "backend": "Node.js + Express",
                           "database": "PostgreSQL", "auth": "JWT", "infra": "Docker"},
            "tasks": [{"title": t, "description": f"{d} for: {idea}"} for t, d in steps]}

def _parse_plan(plan: dict, idea: str) -> dict:
    reqs = _list(_pick(plan, "requirements", "reqs", "features"))
    raw_tasks = _pick(plan, "tasks", "steps", "plan") or []
    tasks = []
    for t in raw_tasks if isinstance(raw_tasks, list) else []:
        if isinstance(t, dict):
            title = _s(_pick(t, "title", "name", "task", "step") or "")
            desc = _s(_pick(t, "description", "desc", "details", "summary") or "")
        else:
            title, desc = _s(t), ""
        if title:
            tasks.append({"title": title, "description": desc or title})
    ts = plan.get("tech_stack") or plan.get("techStack") or plan.get("stack")
    stack = {str(k): _s(v) for k, v in ts.items() if _s(v)} if isinstance(ts, dict) else {}
    if not reqs and tasks:
        reqs = [t["title"] for t in tasks]              # fallback: derive requirements from tasks
    if not reqs or not tasks:
        raise ValueError("LLM returned an empty plan")
    return {"goal": _s(plan.get("goal") or idea), "requirements": reqs, "tech_stack": stack, "tasks": tasks}

def make_plan(idea: str) -> dict:
    if MOCK:
        return _mock_plan(idea)
    prompt = (
        "You are Aegis, an expert project planner. Read the user's idea and produce a project plan SPECIFIC to it "
        "(honor any technologies, domain and constraints they mention; otherwise choose a sensible modern stack).\n"
        'Reply with ONLY a JSON object using EXACTLY these keys: {"goal": "one clear sentence", '
        '"requirements": ["5-8 concrete, testable requirements"], '
        '"tech_stack": {"frontend": "...", "backend": "...", "database": "...", "auth": "...", "infra": "...", "other": "..."}, '
        '"tasks": [{"title": "short imperative title", "description": "one sentence on what this step must achieve"}]} '
        "with 6-9 tasks in build order that together cover every requirement. Keep every string short.\n"
        f"User idea: {idea}")
    last = None
    for attempt in range(2):
        txt = ""
        try:
            txt = _ask(prompt, 2000 + attempt * 1500, json_mode=(attempt == 0))
            return _parse_plan(_json(txt), idea)
        except Exception as e:
            last = e
            print(f"[Aegis] plan attempt {attempt + 1} failed: {e}\n--- raw ---\n{txt[:800]}\n-----------")
    raise ValueError(str(last))

def plan_step(goal: str, requirements: list[str], tech_stack: dict, task: dict, nudge: str | None = None) -> dict:
    """Detailed guide for ONE step: how to do it, endpoints, components, data, acceptance checks."""
    if MOCK:
        t = task["title"]
        return {"summary": f"{t}: {task['description']}",
                "how_to": [f"Plan and implement: {t}", "Write tests for it", "Review against requirements"],
                "backend": ["GET /api/example - placeholder endpoint"], "frontend": ["ExamplePage - placeholder screen"],
                "data": ["example: id, created_at"], "done_when": ["The step works end to end"]}
    stack = "; ".join(f"{k}: {v}" for k, v in tech_stack.items()) or "choose sensible defaults"
    p = (
        "You are Aegis, a project-planning assistant. You do NOT build or run anything and you never claim to have "
        "created anything. You tell the developer exactly HOW to do this step.\n"
        f"Project goal: {goal}\nRequirements: {'; '.join(requirements)}\nTech stack: {stack}\n"
        f"Current step: {task['title']} - {task['description']}\n"
        + (f"Feedback you must follow: {nudge}\n" if nudge else "")
        + 'Reply with ONLY JSON: {"summary": "1-2 sentences on what this step delivers (imperative/future tense, never say '
          'created/implemented)", "how_to": ["4-7 concrete ordered actions"], '
          '"backend": ["METHOD /path - purpose, key request/response fields (empty list if this step has none)"], '
          '"frontend": ["Page or component - what it shows and which endpoint it calls (empty list if none)"], '
          '"data": ["table or collection: key fields and relations (empty list if none)"], '
          '"done_when": ["2-4 testable acceptance checks"]}. '
          "Be specific to this project and stack. Stay strictly within the goal and requirements; add no unrelated features.")
    last = None
    for attempt in range(2):
        try:
            g = _json(_ask(p, 1500 + attempt * 1000, json_mode=(attempt == 0)))
            guide = {"summary": _s(g.get("summary", "")), "how_to": _list(g.get("how_to")), "backend": _list(g.get("backend")),
                     "frontend": _list(g.get("frontend")), "data": _list(g.get("data")), "done_when": _list(g.get("done_when"))}
            if not guide["summary"]:
                raise ValueError("LLM returned an empty step guide")
            return guide
        except Exception as e:
            last = e
            print(f"[Aegis] step attempt {attempt + 1} failed: {e}")
    raise ValueError(str(last))

def intervention(goal: str, missed: str) -> str:
    if MOCK:
        return f"Re-align with the original requirement: {missed}."
    return _ask(f"Project goal: {goal}\nThe latest step drifted away from this requirement: {missed}\n"
                "Write ONE short sentence of feedback telling the planner how to re-align with it.", 80)

def final_summary(goal: str, steps: list[dict]) -> str:
    if MOCK:
        return f"Project '{goal}' planned in {len(steps)} steps, all aligned to the original goal."
    lines = "\n".join(f"- {s['title']}: {s['summary']}" for s in steps)
    return _ask(f"Goal: {goal}\nPlanned steps:\n{lines}\nWrite a 3-4 sentence executive summary of this project plan.", 250)