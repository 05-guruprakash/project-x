"""Proof-of-life for the drift ML. Run:  python test_drift.py
Expect: ON = ok, SUBTLE and OFF = DRIFT. Shows which mode (trained / heuristic) is active."""
from drift import detect_drift, MODEL_PATH

GOAL = "Build an online banking application with account management, transfers and secure authentication"
REQS = ["User registration and secure login", "Account and balance management",
        "Money transfers between accounts", "Transaction history", "Security and encryption of sensitive data"]
TASK = "Design the database schema. Define users, accounts and transactions tables with keys and indexes"
CASES = [("ON    ", "Define users, accounts and transactions tables with foreign keys, indexes and encrypted account numbers"),
         ("SUBTLE", "Add an animated 3D particle background and a dark-mode toggle to the landing page"),
         ("OFF   ", "Write a blog post about the best coffee brewing methods")]

print("Trained model file:", "FOUND" if MODEL_PATH.exists() else "NOT found -> heuristic mode (run train_drift.py)")
for label, cp in CASES:
    d = detect_drift(GOAL, REQS, [cp], TASK)
    print(f"{label} mode={d['mode']:9} aligned={d['alignment']:.2f} {'DRIFT' if d['drifting'] else 'ok   '} {d['features']} | {cp[:55]}")
