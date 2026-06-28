# 🐾 PawCare — Dog Wellness Platform

A browser-based dog wellness platform for pet owners and breeders, powered by machine learning. Built as a 30-day project.

**Live demo:** `https://pawcare.vercel.app` *(available after Day 29)*

---

## What it does

- **Symptom checker** — describe symptoms → ML illness prediction + severity label
- **Breed identifier** — upload a photo → CNN identifies the breed
- **Feeding planner** — daily portion calculator based on breed, weight, and age
- **Vet & vaccine tracker** — log visits, track due dates, get email reminders
- **Weight & growth chart** — track weight over time vs. breed standard
- **Reproductive cycle tracker** — predict next heat cycle + breeding window
- **Breeder tools** — litter management, puppy profiles, health certificate PDFs

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| ML | scikit-learn + TensorFlow/Keras |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Project structure

```
dog-wellness/
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── pages/       # One file per route
│   │   ├── components/  # Shared UI components
│   │   ├── hooks/       # useAuth, etc.
│   │   └── lib/         # supabase.js, api.js
│   └── .env.example     # Copy to .env and fill in values
│
├── backend/             # FastAPI app
│   ├── main.py          # App entry point + CORS
│   ├── auth.py          # JWT middleware
│   ├── schemas.py       # Pydantic models
│   ├── routers/         # One file per feature
│   │   ├── dogs.py
│   │   ├── vet.py
│   │   ├── symptoms.py
│   │   ├── nutrition.py
│   │   └── predict.py
│   ├── ml_models/       # .pkl and .h5 files (added Day 9+)
│   ├── requirements.txt
│   └── .env.example     # Copy to .env and fill in values
│
└── supabase_schema.sql  # Run this in Supabase SQL Editor on Day 2
```

---

## Local setup

### Prerequisites
- Node.js v20+
- Python 3.11+
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/your-username/dog-wellness.git
cd dog-wellness

# Frontend
cd frontend
npm install
cp .env.example .env
# → fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# → fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase_schema.sql` → Run
3. Go to **Authentication → Providers → Email** → toggle on
4. Copy your **Project URL** and **anon key** from **Settings → API**

### 3. Run locally

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000
# API docs at: http://localhost:8000/docs

# Terminal 2 — Frontend
cd frontend
npm run dev
# App at: http://localhost:3000
```

---

## Build plan progress

| Week | Days | Status |
|---|---|---|
| Week 1 — Foundation | Days 1–7 | Day 1 ✅ |
| Week 2 — Core features | Days 8–14 | Upcoming |
| Week 3 — ML features | Days 15–21 | Upcoming |
| Week 4 — Breeder + polish + deploy | Days 22–30 | Upcoming |

---

## Deployment

**Frontend (Vercel)**
1. Push to GitHub
2. Connect repo at [vercel.com](https://vercel.com)
3. Set build: `cd frontend && npm run build`, output: `frontend/dist`
4. Add environment variables in Vercel dashboard

**Backend (Railway)**
1. Connect repo at [railway.app](https://railway.app)
2. Set root to `backend/`, start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables in Railway dashboard

---

*Built with 🐾 for dogs everywhere.*
