"""Trains the drift classifier. Groq generates labeled synthetic data, then LogisticRegression is fit.
Run once:  python train_drift.py     (needs GROQ_API_KEY in .env; takes ~2-3 min)
Creates drift_model.joblib -> drift.py picks it up automatically."""
import json, re, time, sys
import joblib
import llm
from drift import features, MODEL_PATH
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

if llm.MOCK:
    sys.exit("Set GROQ_API_KEY in backend/.env first (MOCK mode can't generate training data).")

DOMAINS = [["club management app", "e-commerce store", "fitness tracker", "hospital scheduling", "food delivery"],
           ["chat app", "online learning platform", "inventory system", "expense tracker", "job board"],
           ["IoT smart home dashboard", "ML image classifier web app", "travel planner", "library system", "bug tracker"],
           ["real-time multiplayer game", "recipe sharing site", "crypto price dashboard", "event ticketing", "parking finder"]]

PROMPT = """Generate training data for detecting goal drift in an AI agent that builds projects.
For EACH of these project types: {domains} invent a specific project with a one-sentence goal and 4-5 concrete requirements.
For each project give 3 samples. A sample = {{"task": "a build task from the plan",
"on_track": "1-2 sentence checkpoint clearly doing that task for that project",
"subtle_drift": "1-2 sentence checkpoint that sounds plausible and technical but is NOT the task and serves none of the requirements (gold-plating, unrelated tooling, cosmetic polish)",
"off_topic": "1-2 sentence checkpoint about something unrelated to the project"}}.
Reply ONLY JSON: {{"projects": [{{"goal": str, "requirements": [str], "samples": [{{"task": str, "on_track": str, "subtle_drift": str, "off_topic": str}}]}}]}}"""

rows, labels = [], []
for i, domains in enumerate(DOMAINS):
    data = None
    for attempt in range(3):
        try:
            raw = llm._ask(PROMPT.format(domains=", ".join(domains)), 6000, True)
            data = json.loads(re.search(r"\{.*\}", raw, re.S).group(0))
            break
        except Exception as e:
            print(f"batch {i+1} attempt {attempt+1} failed: {str(e)[:150]}")
            time.sleep(30)
    if data is None:
        continue
    for p in data["projects"]:
        for s in p["samples"]:
            for key, y in (("on_track", 0), ("subtle_drift", 1), ("off_topic", 1)):
                if not s.get(key) or not s.get("task"):
                    continue
                rows.append(features(p["goal"], p["requirements"], s[key], s["task"] + ". "))
                labels.append(y)
    print(f"batch {i+1}/{len(DOMAINS)} done, {len(rows)} rows so far")
    time.sleep(30)   # stay under free-tier token limits

if len(rows) < 50:
    sys.exit("Not enough data generated. Re-run.")
Xtr, Xte, ytr, yte = train_test_split(rows, labels, test_size=0.25, random_state=0, stratify=labels)
clf = LogisticRegression(class_weight="balanced", max_iter=1000).fit(Xtr, ytr)
print(classification_report(yte, clf.predict(Xte), target_names=["on_track", "drift"]))
joblib.dump(clf, MODEL_PATH)
print("saved", MODEL_PATH, "| weights [sim_goal, best_req, sim_task]:", clf.coef_[0].round(2))