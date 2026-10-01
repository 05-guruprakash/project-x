"""Finds a Groq model your key can actually call (incl. JSON mode) and saves it to backend/.env.
Run from backend/:  python check_groq.py"""
import os, re
from pathlib import Path
from dotenv import load_dotenv

ENV = Path(__file__).parent / ".env"
load_dotenv(ENV, override=True)
from groq import Groq

key = os.getenv("GROQ_API_KEY", "").strip().strip('"\'')
if not key:
    raise SystemExit("GROQ_API_KEY not found. Is the file named exactly .env and inside backend/ ?")
client = Groq(api_key=key)

ids = sorted(m.id for m in client.models.list().data)
print(f"\nModels your key can see ({len(ids)}):")
for i in ids: print("  ", i)

SKIP = ("whisper", "tts", "guard", "embed", "orpheus", "safeguard")
chat = [i for i in ids if not any(s in i.lower() for s in SKIP)]
PREFER = ("llama-3.3-70b", "llama-3.1-8b", "llama-4", "gpt-oss", "llama")
chat.sort(key=lambda i: next((n for n, p in enumerate(PREFER) if p in i.lower()), len(PREFER)))

print("\nTesting chat + JSON mode on each candidate...")
working = None
for mid in chat:
    try:
        r = client.chat.completions.create(
            model=mid, max_tokens=60,
            messages=[{"role": "user", "content": 'Reply with ONLY this JSON: {"ok": true}'}],
            response_format={"type": "json_object"})
        print(f"  OK    {mid}  ->  {r.choices[0].message.content.strip()[:40]}")
        working = mid
        break
    except Exception as e:
        print(f"  FAIL  {mid}  ->  {str(e)[:90]}")

if not working:
    raise SystemExit("\nNo model worked. Check console.groq.com: is this key from the right project, "
                     "and are any models enabled/allowed for it?")

lines = ENV.read_text().splitlines() if ENV.exists() else []
lines = [l for l in lines if not l.strip().startswith("GROQ_MODEL")]
lines.append(f"GROQ_MODEL={working}")
ENV.write_text("\n".join(lines) + "\n")
print(f"\nSaved GROQ_MODEL={working} to {ENV}\nNow restart uvicorn and run: python train_drift.py")