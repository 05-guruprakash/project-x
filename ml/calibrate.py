"""Run: python calibrate.py  -> pick ALIGN_MIN between the ON and OFF scores."""
from drift import detect_drift
GOAL = "Build a club management app with PostgreSQL database and user auth"
REQS = ["PostgreSQL database schema", "User authentication", "Event management pages", "Deployment"]
ON = ["Designed users and events tables in PostgreSQL",
      "Built login and signup endpoints with JWT",
      "Created React pages to list and create events"]
OFF = ["Started designing an animated logo for the marketing page",
       "Wrote a blog post about coffee brewing",
       "Researched cryptocurrency trading bots"]
for label, items in (("ON ", ON), ("OFF", OFF)):
    for s in items:
        print(label, detect_drift(GOAL, REQS, [s])["alignment"], "|", s)
