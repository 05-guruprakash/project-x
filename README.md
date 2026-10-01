# Project-X MVP (frontend + drift model)

## Backend
cd backend
pip install -r requirements.txt
python calibrate.py            # 1st: check ON scores > OFF scores, set ALIGN_MIN between them
ALIGN_MIN=0.30 uvicorn main:app --reload --port 8000
# real LLM: MOCK_LLM=false ANTHROPIC_API_KEY=... uvicorn main:app --reload

## Frontend
cd frontend
npm install
npm run dev     # http://localhost:5173  (VITE_API=http://host:8000 to change backend)
