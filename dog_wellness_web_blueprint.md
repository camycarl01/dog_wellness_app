# 🐾 Dog Wellness Web App — Full Project Blueprint & 30-Day Build Plan

> **Goal:** A browser-based dog wellness platform for individual pet owners and breeders,
> powered by machine learning. Built in 30 days, shareable via a single URL — no device needed to present.

---

## 1. Why Web Over Mobile (Decision Log)

| Factor | Web App ✅ | Mobile App ❌ |
|---|---|---|
| Presenting to lecturers / panel | Share a URL, works instantly | Need device or complex APK install |
| Deployment speed | Push to GitHub → live in 2 min (Vercel) | App Store review takes days |
| Build speed | Faster — more tools, more tutorials | React Native quirks slow you down |
| ML integration | FastAPI backend works perfectly | Same, but mobile networking adds friction |
| Camera (breed ID) | Works in Chrome/Firefox | Would need native permissions |
| Notifications | Browser notifications or email | Push notifications (complex setup) |
| **Verdict** | ✅ Best for a 30-day academic/portfolio project | ❌ Better for post-launch v2 |

---

## 2. What Problems This App Solves

| User Question | Feature That Answers It |
|---|---|
| Is my dog sick or just tired? | Symptom checker + ML illness predictor |
| How bad is it — should I rush to the vet? | Severity classifier (mild / moderate / severe / emergency) |
| What should I feed my dog today? | Breed + weight-based meal planner |
| When was my dog last vaccinated? | Vaccine tracker with due-date alerts |
| Is my dog in heat right now? | Reproductive cycle tracker + calendar |
| What breed is my dog? (photo) | CNN-based breed identification |
| Is my dog at a healthy weight? | Growth curve chart vs. breed standard |
| What foods are dangerous for my dog? | Toxic food database with search |
| When should I visit the vet next? | Vet appointment scheduler + email reminders |
| How do I train my dog? | Training tips library by command & age |
| I'm a breeder — how do I track litters? | Litter & puppy management dashboard |

---

## 3. Full Feature List

### Core Features (Week 1–2)
- **Dog profile** — name, breed, DOB, weight, sex, neutered status, photo upload
- **Symptom checker** — checkbox form → ML illness prediction + severity label
- **Feeding planner** — daily portion calculator (breed + weight + age + activity)
- **Vet visit log** — past visits, notes, next appointment date
- **Vaccine tracker** — vaccine name, date given, next due date, status badges
- **Dashboard** — health summary card, today's feeding, next vet date, weight trend

### ML-Powered Features (Week 3)
- **Illness predictor** — Random Forest classifier: symptoms → disease + severity
- **Breed identifier** — MobileNetV2 CNN: photo upload → top-3 breed predictions
- **Feeding recommender** — XGBoost regression: breed + weight + age → kcal/day + grams
- **Cycle predictor** — past heat dates → predicted next cycle + breeding window

### Additional Features (Week 3–4)
- **Weight & growth chart** — line chart vs. breed standard reference band
- **Mood / behavior log** — daily entry with emoji scale + text notes
- **Activity log** — walk duration, play sessions, energy level
- **Toxic food database** — searchable, with danger level and emergency guidance
- **Training tips** — categorized by command, dog age, and difficulty
- **Email reminders** — vaccine due dates, vet appointments (via SendGrid free tier)

### Breeder Features (Week 4)
- **Reproductive cycle calendar** — heat cycle history + predicted windows
- **Litter management** — create litter, add puppies, track per-puppy health
- **Puppy profiles** — weight, vaccines, buyer name, sold status
- **Health certificate export** — PDF download per puppy

---

## 4. Data Flow

```
[User in Browser]
      │
      ├── Fills forms (symptoms, weight, meals, mood, vaccines)
      ├── Uploads photo (breed identification)
      └── Selects dates (vet visits, heat cycles)
      │
      ▼
[React Frontend] ──── REST API calls ────► [FastAPI Backend]
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          ▼                       ▼                       ▼
                   [PostgreSQL DB]         [ML Models]            [File Storage]
                   (Supabase)              ├── Illness classifier  (Supabase Storage)
                   ├── users              ├── Breed CNN            └── Dog photos
                   ├── dogs              ├── Feeding model
                   ├── symptom_logs      └── Cycle predictor
                   ├── feeding_logs
                   ├── vet_visits
                   ├── vaccines
                   ├── weight_logs
                   ├── mood_logs
                   ├── heat_cycles
                   ├── litters
                   └── puppies
                          │
                          ▼
                   [Dashboard & Charts]
                   (data rendered back in browser)
```

### ML Pipeline

```
ILLNESS PREDICTOR
  Input:  symptom checkboxes + dog age + duration (days)
  Model:  Random Forest Classifier
  Output: illness name + confidence % + severity (Mild/Moderate/Severe/Emergency)
  Dataset: Synthesized from veterinary symptom guides + Kaggle dog health data

BREED IDENTIFIER
  Input:  dog photo (resized to 224×224 in browser before upload)
  Model:  MobileNetV2 fine-tuned on Stanford Dogs Dataset (120 breeds)
  Output: top-3 breed predictions + confidence percentages
  Dataset: Stanford Dogs Dataset (free, 20,580 images)

FEEDING RECOMMENDER
  Input:  breed size category + current weight (kg) + age (months) + activity level
  Model:  XGBoost Regressor
  Output: daily calorie target (kcal) + recommended grams per meal
  Dataset: AKC/breed standard feeding tables (compiled manually)

CYCLE PREDICTOR
  Input:  list of past heat cycle start dates
  Model:  Average interval calculation → upgrade to Prophet (Facebook) in v2
  Output: predicted next heat date + breeding window (days 9–14)
```

---

## 5. Tech Stack

### Frontend — React + Vite
- **Why React:** The industry standard. Huge ecosystem, tons of tutorials, works perfectly
  with a FastAPI backend. Vite makes it fast to start and hot-reload during development.
- **UI library:** shadcn/ui — pre-built, beautiful, accessible components (free)
- **Routing:** React Router v6
- **Charts:** Recharts (weight graphs, mood trends — simple and well-documented)
- **Forms:** React Hook Form + Zod validation
- **HTTP calls:** Axios
- **Auth state:** Supabase JS client (handles sessions automatically)

### Backend — FastAPI (Python)
- **Why FastAPI:** Python = best ML ecosystem. FastAPI is fast to write,
  auto-generates API docs at `/docs`, handles async, and is production-ready.
- **Database ORM:** SQLAlchemy (or Supabase Python client directly)
- **Auth:** Supabase Auth (JWT tokens — handled for you, free)
- **File uploads:** Python-multipart for handling photo uploads
- **PDF generation:** ReportLab (for puppy health certificates)
- **Email reminders:** SendGrid free tier (100 emails/day free)

### Database & Storage — Supabase (Free Tier)
- **PostgreSQL** — your main database, hosted and managed
- **Supabase Auth** — login/signup, password reset, JWT sessions
- **Supabase Storage** — dog photos, exported PDFs
- **Why Supabase:** Replaces months of backend infrastructure work.
  Free tier gives you 500MB DB + 1GB storage — more than enough.

### Machine Learning — Python
- **scikit-learn** — illness classifier (Random Forest) + feeding model (XGBoost)
- **TensorFlow / Keras** — breed CNN (MobileNetV2 transfer learning)
- **Pillow** — image preprocessing before feeding into CNN
- **Joblib** — saving and loading sklearn models
- **Google Colab** — train your CNN for free (free GPU, no setup needed)

### Deployment — Free Tier
- **Frontend:** Vercel (connect GitHub repo → auto-deploys on every push, free forever)
- **Backend:** Render.com (free tier FastAPI hosting, sleeps after 15min inactivity —
  use Railway.app $5/mo if you need it always on for your demo)
- **Database:** Supabase (free tier, always on)
- **Domain:** Your Vercel URL is enough for demo (e.g. `dogwellness.vercel.app`)

### Full Stack Summary

```
Browser (React + Vite)
    │  HTTPS REST calls
    ▼
FastAPI (Render / Railway)
    ├── /api/dogs          → Supabase PostgreSQL
    ├── /api/symptoms      → Supabase PostgreSQL
    ├── /api/predict/illness   → sklearn model (loaded in memory)
    ├── /api/predict/breed     → TensorFlow model (loaded in memory)
    ├── /api/feeding       → XGBoost model (loaded in memory)
    └── /api/storage       → Supabase Storage (photos)
```

---

## 6. Database Schema

```sql
-- Core
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  is_breeder BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)

dogs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  breed TEXT,
  dob DATE,
  weight_kg DECIMAL,
  sex TEXT,           -- 'male' | 'female'
  is_neutered BOOLEAN,
  photo_url TEXT,
  created_at TIMESTAMP
)

-- Health
symptom_logs (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  logged_at TIMESTAMP,
  symptoms JSONB,        -- { "lethargy": true, "vomiting": false, ... }
  duration_days INTEGER,
  prediction TEXT,       -- predicted illness name
  severity TEXT,         -- 'mild' | 'moderate' | 'severe' | 'emergency'
  confidence DECIMAL
)

-- Nutrition
feeding_logs (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  logged_at TIMESTAMP,
  meal_time TEXT,        -- 'morning' | 'afternoon' | 'evening'
  food_type TEXT,
  quantity_grams DECIMAL,
  notes TEXT
)

-- Vet
vet_visits (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  visit_date DATE,
  reason TEXT,
  notes TEXT,
  next_due_date DATE,
  vet_name TEXT
)

vaccines (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  vaccine_name TEXT,
  given_date DATE,
  next_due_date DATE,
  status TEXT           -- 'up_to_date' | 'due_soon' | 'overdue'
)

-- Tracking
weight_logs (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  logged_at TIMESTAMP,
  weight_kg DECIMAL
)

mood_logs (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  logged_at TIMESTAMP,
  mood_score INTEGER,    -- 1 (very bad) to 5 (great)
  mood_label TEXT,       -- 'anxious' | 'calm' | 'playful' | 'lethargic' | 'aggressive'
  notes TEXT
)

-- Reproductive (female dogs)
heat_cycles (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  start_date DATE,
  end_date DATE,
  notes TEXT
)

-- Breeder
litters (
  id UUID PRIMARY KEY,
  mother_dog_id UUID REFERENCES dogs(id),
  sire_name TEXT,
  birth_date DATE,
  puppy_count INTEGER,
  notes TEXT
)

puppies (
  id UUID PRIMARY KEY,
  litter_id UUID REFERENCES litters(id),
  name TEXT,
  sex TEXT,
  weight_kg DECIMAL,
  colour TEXT,
  buyer_name TEXT,
  buyer_contact TEXT,
  is_sold BOOLEAN DEFAULT false,
  notes TEXT
)
```

---

## 7. App Pages (Web Routes)

```
/login                    → Login / signup page
/dashboard                → Home: health summary, feeding today, vet countdown
/dogs/new                 → Add new dog profile
/dogs/:id                 → Dog profile detail + edit

/health                   → Symptom checker form
/health/result            → Illness prediction result + severity badge
/health/history           → Past symptom checks log

/nutrition                → Today's feeding recommendation
/nutrition/log            → Log today's meals
/nutrition/toxic-foods    → Searchable toxic food database

/vet                      → Vet visits list + add new visit
/vet/vaccines             → Vaccine tracker + status badges

/tracking/weight          → Weight log form + growth chart
/tracking/mood            → Mood log + 7-day trend
/tracking/activity        → Walk & play log

/breed-id                 → Photo upload → breed prediction result
/training                 → Training tips filtered by command + age

/reproductive             → Heat cycle calendar + next cycle prediction (female only)

/breeder                  → Breeder dashboard (visible if is_breeder = true)
/breeder/litters          → Litter list
/breeder/litters/:id      → Litter detail + puppy list
/breeder/puppies/:id      → Puppy profile + health certificate download

/settings                 → Profile, notifications, add second dog
```

---

## 8. The 30-Day Build Plan

> **Daily commitment:** 4–6 hours on weekdays, 2–3 hours on weekends.
> **Golden rule:** Get a working app by Day 20. Days 21–30 are ML, polish, and deployment.
> **If you fall behind:** Drop mood logs and training tips. Nail the 4 core features first.

---

### ⚙️ WEEK 1 — Setup & Foundation (Days 1–7)
*Goal: Project running locally, database connected, login working, dog profile on screen*

**Day 1 — Dev environment**
- [ ] Install: Node.js (v20), Python 3.11, Git, VS Code
- [ ] Create React + Vite project: `npm create vite@latest dog-wellness -- --template react`
- [ ] Install frontend deps: `npm install react-router-dom axios react-hook-form zod @hookform/resolvers recharts`
- [ ] Install shadcn/ui: follow docs at ui.shadcn.com/docs/installation
- [ ] Create FastAPI project: `mkdir backend && cd backend && python -m venv venv`
- [ ] Install backend deps: `pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv python-multipart pillow`
- [ ] Create Supabase account at supabase.com → new project → save URL + anon key
- [ ] Push both folders to GitHub as a monorepo

**Day 2 — Database setup**
- [ ] Open Supabase SQL editor → create all tables from Section 6 above
- [ ] Enable Row Level Security (RLS) on all tables (Supabase docs will guide you)
- [ ] Enable Supabase Auth → Email provider turned on
- [ ] Test: manually insert a user via Supabase dashboard
- [ ] Set up `.env` files:
  - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
  - Backend: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

**Day 3 — Auth (login/signup)**
- [ ] Install Supabase JS: `npm install @supabase/supabase-js`
- [ ] Create `supabase.js` client file in frontend
- [ ] Build: Login page (email + password form using shadcn/ui Card + Input + Button)
- [ ] Build: Signup page (email, password, name, is_breeder checkbox)
- [ ] Wire up: `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`
- [ ] Add auth guard: redirect to `/login` if not logged in
- [ ] Test: sign up, log in, log out — all working

**Day 4 — Dog profile (backend)**
- [ ] FastAPI: `main.py` with CORS configured for your frontend URL
- [ ] FastAPI routes:
  - `POST /api/dogs` — create dog
  - `GET /api/dogs` — list user's dogs
  - `GET /api/dogs/{id}` — single dog
  - `PUT /api/dogs/{id}` — update dog
- [ ] Add JWT auth middleware (verify Supabase token on each request)
- [ ] Test all routes in FastAPI `/docs`
- [ ] Run locally: `uvicorn main:app --reload`

**Day 5 — Dog profile (frontend)**
- [ ] Build: Add Dog page (`/dogs/new`) — form with name, breed, DOB, sex, weight, neutered toggle
- [ ] Build: Dog profile page (`/dogs/:id`) — display all dog details
- [ ] Connect to FastAPI via Axios
- [ ] Add dog photo upload → store in Supabase Storage → save URL in dogs table
- [ ] Test: add a dog from the browser, see it appear on profile page

**Day 6 — Dashboard**
- [ ] Build: Dashboard page (`/dashboard`) with:
  - Dog name + breed + age card (top)
  - Health status placeholder card
  - Today's feeding placeholder card
  - Next vet visit placeholder (shows "Not set yet" for now)
  - Quick action buttons (Check symptoms / Log meal / Log weight)
- [ ] Build: Navigation sidebar or top nav with all main routes
- [ ] Add dog switcher if user has multiple dogs

**Day 7 — Vet tracker**
- [ ] FastAPI: `POST /api/vet-visits`, `GET /api/vet-visits/{dog_id}`
- [ ] FastAPI: `POST /api/vaccines`, `GET /api/vaccines/{dog_id}`
- [ ] Build: Vet visits page — list of past visits + "Add visit" form
- [ ] Build: Vaccine tracker page — table of vaccines with status badge (up to date / due soon / overdue)
- [ ] Status logic: if `next_due_date` < today → overdue (red), < 30 days → due soon (amber), else → up to date (green)

---

### 🔨 WEEK 2 — Core Features (Days 8–14)
*Goal: Symptom checker, feeding, weight tracking all working end-to-end*

**Day 8 — Symptom checker (UI)**
- [ ] Build: Symptom checker page with checkbox grid:
  - Lethargy / Vomiting / Diarrhea / Loss of appetite / Coughing / Sneezing
  - Limping / Scratching / Eye discharge / Nasal discharge / Swelling / Seizure
  - Plus: duration (days), temperature if known
- [ ] On submit → `POST /api/predict/illness` (returns placeholder for now)
- [ ] Build: Result page — illness name, confidence %, severity badge, "See a vet" CTA for severe/emergency
- [ ] Build: History page — past symptom checks in a table

**Day 9 — Illness ML model (training)**
- [ ] Open Google Colab (free, no setup needed)
- [ ] Build training dataset: 15–20 common dog illnesses, each with symptom combinations
  - Parvovirus: vomiting, diarrhea, lethargy, loss of appetite → severity: emergency
  - Kennel cough: coughing, sneezing, nasal discharge → severity: mild
  - Hip dysplasia: limping, lethargy → severity: moderate
  - Ear infection: scratching, head shaking, discharge → severity: mild
  - (continue for all illnesses)
- [ ] Train Random Forest classifier using scikit-learn
- [ ] Evaluate: aim for >75% accuracy
- [ ] Save: `joblib.dump(model, 'illness_model.pkl')`
- [ ] Download `.pkl` file to your backend folder

**Day 10 — Illness ML model (API)**
- [ ] Load model in FastAPI on startup: `model = joblib.load('illness_model.pkl')`
- [ ] FastAPI: `POST /api/predict/illness`
  - Input: symptoms dict + dog age + duration
  - Output: `{ illness, confidence, severity, recommendation }`
- [ ] Connect symptom checker result page to real predictions
- [ ] Test: enter different symptom combinations, see real predictions

**Day 11 — Feeding calculator**
- [ ] Research and compile a feeding reference table (breed size → kcal/kg/day)
  - Toy breeds (< 5kg): 110 kcal/kg
  - Small breeds (5–10kg): 85 kcal/kg
  - Medium breeds (10–25kg): 70 kcal/kg
  - Large breeds (25–45kg): 60 kcal/kg
  - Giant breeds (> 45kg): 50 kcal/kg
- [ ] FastAPI: `GET /api/feeding-recommendation/{dog_id}` — computes kcal + grams per meal
- [ ] Build: Feeding page — shows recommended daily grams + per-meal split + food type notes
- [ ] Build: Meal log form — log actual food + quantity
- [ ] FastAPI: `POST /api/feeding-logs`

**Day 12 — Weight & growth chart**
- [ ] FastAPI: `POST /api/weight-logs`, `GET /api/weight-logs/{dog_id}`
- [ ] Build: Weight log page — input field (kg) + date + submit
- [ ] Build: Growth chart using Recharts `<LineChart>`:
  - Blue line: dog's actual weight over time
  - Grey shaded band: expected weight range for breed size
- [ ] Add "Underweight / Healthy / Overweight" status badge below chart

**Day 13 — Mood & activity logs**
- [ ] FastAPI: `POST /api/mood-logs`, `GET /api/mood-logs/{dog_id}`
- [ ] Build: Mood log page — emoji scale (😞😐🙂😊😄) + mood label dropdown + notes
- [ ] Build: Activity log page — walk duration (minutes), play time, energy level
- [ ] Add last 7 days' mood to dashboard as colored dot strip

**Day 14 — Week 2 review & fixes**
- [ ] Go through every page and fix broken layouts
- [ ] Make sure all Axios calls handle errors gracefully (show error toast, not crash)
- [ ] Add loading spinners to all API calls
- [ ] Test entire flow: sign up → add dog → check symptoms → log meal → log weight
- [ ] Deploy backend to Render.com (first test deployment)

---

### 🤖 WEEK 3 — ML Features (Days 15–21)
*Goal: Breed ID working, feeding ML model, reproductive tracker, training tips*

**Day 15 — Breed ID model (training)**
- [ ] Open Google Colab
- [ ] Download Stanford Dogs Dataset (or start with 10 breeds to keep it manageable)
- [ ] Load MobileNetV2 with pre-trained ImageNet weights (no top layer)
- [ ] Add classification head: `GlobalAveragePooling2D → Dense(256) → Dense(num_breeds, softmax)`
- [ ] Freeze base layers → train top layers for 10 epochs
- [ ] Unfreeze last 20 layers → fine-tune for 5 more epochs
- [ ] Save model: `model.save('breed_model.h5')`
- [ ] Test: upload 5 dog photos manually, check predictions

**Day 16 — Breed ID (API + UI)**
- [ ] FastAPI: `POST /api/predict/breed`
  - Accepts: image file (multipart)
  - Preprocesses: resize to 224×224, normalize
  - Returns: `[{ breed, confidence }, { breed, confidence }, { breed, confidence }]`
- [ ] Build: Breed ID page
  - Drag-and-drop or click-to-upload photo zone
  - Preview the uploaded photo
  - Show top-3 breed results as cards with confidence bars
  - "Save breed to dog profile" button
- [ ] Test across different dog photos

**Day 17 — Feeding ML upgrade**
- [ ] Build XGBoost regression model in Colab:
  - Features: breed_size_category (0–4), weight_kg, age_months, activity_level (0–3)
  - Target: kcal_per_day
  - Training data: compiled from breed feeding standards
- [ ] Save model: `joblib.dump(model, 'feeding_model.pkl')`
- [ ] Update FastAPI `/api/feeding-recommendation` to use ML model
- [ ] A/B compare ML output vs rule-based output for 5 dogs → keep the more accurate one

**Day 18 — Reproductive cycle tracker**
- [ ] FastAPI: `POST /api/heat-cycles`, `GET /api/heat-cycles/{dog_id}`
- [ ] FastAPI: `GET /api/predict/next-cycle/{dog_id}`
  - Average past cycle lengths → predict next start date
  - Calculate breeding window: start_date + 9 to start_date + 14
- [ ] Build: Reproductive page (only shown for female, un-neutered dogs)
  - Calendar showing past heat cycles in pink
  - Predicted next cycle in lighter shade
  - Breeding window highlighted in amber
  - "Log new heat cycle" button

**Day 19 — Training tips module**
- [ ] Create `training_tips.json`:
  ```
  [
    { "command": "sit", "age_group": "puppy", "difficulty": "beginner", "tip": "...", "steps": [...] },
    { "command": "stay", "age_group": "adult", ... },
    ...
  ]
  ```
  (Write 30–40 tips covering: sit, stay, heel, come, down, leave it, shake, crate training)
- [ ] FastAPI: `GET /api/training-tips?command=sit&age_months=4`
- [ ] Build: Training page — filter by command type + dog age
- [ ] Build: Training log — mark tips as tried, rate dog's progress (1–5 stars)

**Day 20 — Toxic food database**
- [ ] Create `toxic_foods.json` with 40+ entries:
  ```
  [
    { "name": "Chocolate", "danger": "high", "symptoms": "vomiting, seizures", "action": "Emergency vet now" },
    { "name": "Grapes", "danger": "high", ... },
    { "name": "Onions", "danger": "moderate", ... },
    ...
  ]
  ```
- [ ] FastAPI: `GET /api/toxic-foods?search=chocolate`
- [ ] Build: Toxic foods page — search bar + card grid of results with red/amber danger badges
- [ ] Add "Call vet immediately" button for high-danger foods

**Day 21 — Week 3 review + email reminders**
- [ ] Set up SendGrid free account (100 emails/day free)
- [ ] FastAPI background task: check vaccine + vet due dates daily
  - If due within 7 days → send reminder email via SendGrid
- [ ] Test: set a vaccine due date to tomorrow → verify email arrives
- [ ] Fix any Week 3 bugs

---

### ✨ WEEK 4 — Breeders, Polish & Launch (Days 22–30)
*Goal: Breeder section done, app feels professional, live URL ready to share*

**Day 22 — Breeder: litter management**
- [ ] FastAPI: `POST /api/litters`, `GET /api/litters/{user_id}`
- [ ] FastAPI: `POST /api/puppies`, `GET /api/puppies/{litter_id}`
- [ ] Build: Breeder dashboard page (only visible if `is_breeder = true`)
- [ ] Build: Create litter form (mother dog, sire name, birth date, puppy count)
- [ ] Build: Litter detail page — list of puppies in that litter

**Day 23 — Breeder: puppy profiles**
- [ ] Build: Add puppy form — name, sex, colour, weight, notes
- [ ] Build: Puppy detail page — vaccine log, weight entries, sold status, buyer info
- [ ] Add "Mark as sold" toggle → shows buyer name + contact field
- [ ] Add puppy weight chart (mini Recharts line chart per puppy)

**Day 24 — Health certificates (PDF export)**
- [ ] FastAPI: `GET /api/puppies/{id}/certificate` — generates PDF using ReportLab
- [ ] PDF contains: breeder name, puppy name, breed, DOB, sex, colour, vaccine list, weight, date issued
- [ ] Build: "Download Health Certificate" button on puppy detail page
- [ ] Test: download PDF, verify it looks clean and professional

**Day 25 — Multi-dog support**
- [ ] Ensure all pages respect the selected dog (not just the first one)
- [ ] Build: Dog switcher in the top nav — dropdown showing all user's dogs + "Add new dog"
- [ ] Test: two dogs with different profiles — switching shows correct data for each
- [ ] Add dog count badge to sidebar nav

**Day 26 — Dashboard polish**
- [ ] Home dashboard should now feel like a real health summary:
  - Dog photo + name + breed + age
  - Health status badge (🟢 Healthy / 🟡 Check symptoms / 🔴 See vet urgently)
  - Next vet visit: "3 days away" countdown
  - Today's feeding: "2× meals, ~300g total"
  - Last weight: "12.4 kg — ↓ 0.2 kg this week"
  - Vaccine status summary: "2 vaccines up to date, 1 due in 14 days"
- [ ] Add empty states for new users ("You haven't logged any weight yet — add your first entry →")

**Day 27 — Responsiveness & browser testing**
- [ ] Test every page on:
  - Desktop (Chrome, Firefox)
  - Tablet (browser DevTools responsive mode)
  - Mobile browser (Chrome on Android, Safari on iPhone)
- [ ] Fix any layout breaks (use CSS media queries / Tailwind responsive prefixes)
- [ ] Ensure the breed ID photo upload works on mobile browser
- [ ] Test all forms submit correctly on mobile keyboard

**Day 28 — Error handling & UX polish**
- [ ] Every API call: add loading spinner while waiting
- [ ] Every form: validate inputs before submitting (React Hook Form + Zod)
- [ ] Every failed API call: show a toast notification with the error message
- [ ] Empty states on every list page (no visits logged, no vaccines recorded, etc.)
- [ ] Confirm dialogs before deleting anything ("Are you sure you want to delete this visit?")

**Day 29 — Final deployment**
- [ ] Deploy frontend to Vercel:
  - Connect GitHub repo → select `frontend` folder → auto-deploy
  - Add environment variables in Vercel dashboard
  - Test live URL
- [ ] Deploy backend to Railway.app (more reliable than Render for demos):
  - Connect GitHub → select `backend` folder
  - Add environment variables
  - Test all API endpoints on the live URL
- [ ] Update frontend `.env` to point to live Railway URL
- [ ] Redeploy frontend → test entire app on live URL end-to-end

**Day 30 — Demo prep & documentation**
- [ ] Seed the database with demo data:
  - Create 2 demo dogs (one owner, one breeder with a litter)
  - Add symptom history, weight logs, vaccines, vet visits, mood entries
  - So when you demo, it doesn't look empty
- [ ] Write `README.md` (project description, screenshots, live URL, how to run locally)
- [ ] Take 6–8 screenshots of the best pages for your portfolio
- [ ] Record a 3-minute screen recording demo (use Loom — free)
- [ ] Share your live URL: `dogwellness.vercel.app` 🎉

---

## 9. Priority Matrix

```
MUST HAVE (Week 1–2):           SHOULD HAVE (Week 3):
✅ Dog profile + auth           🔶 Breed ID (CNN)
✅ Symptom checker              🔶 Feeding ML model
✅ Illness ML predictor         🔶 Reproductive tracker
✅ Feeding calculator           🔶 Training tips
✅ Vet visit + vaccine log      🔶 Toxic food database
✅ Weight chart                 🔶 Email reminders
✅ Dashboard

NICE TO HAVE (Week 4):          FUTURE v2:
🔷 Breeder litter management    💡 Community forum
🔷 Puppy health certificates    💡 Vet locator map
🔷 Multi-dog switcher           💡 Wearable integration
🔷 Mood + activity logs         💡 Mobile app (React Native)
🔷 Email reminders polish       💡 Telehealth vet chat
```

---

## 10. Datasets to Download (Do This Early)

| Model | Dataset | Where to Get It |
|---|---|---|
| Breed ID | Stanford Dogs Dataset (120 breeds, 20k+ images) | vision.stanford.edu/anh/dog-dataset |
| Illness | Build synthetic dataset from vet symptom guides | Kaggle: search "dog disease symptoms" |
| Feeding | AKC breed feeding tables | akc.org + manual compilation |
| Toxic foods | ASPCA toxic plant/food list | aspca.org/pet-care/animal-poison-control |
| Training tips | AKC training guides | Write manually (30–40 tips) |

---

## 11. Key Rules to Follow

1. **Build rule-based first, ML second.** On Day 8, your symptom checker returns a placeholder. On Day 10, ML kicks in. Never block feature development waiting for a model.

2. **One feature per day.** Don't try to build three things in one session. A complete, tested feature every day beats three half-finished ones.

3. **Deploy early, deploy often.** First deploy to Render on Day 14. That way you're not scrambling on Day 29. Deployment always takes longer than expected.

4. **Use Google Colab for ML training.** Free GPU, no setup, save the model file, download it. Don't train on your laptop.

5. **Your MVP is four things:** dog profile + symptom checker + feeding plan + vet reminders. If you have those working well, your project has real value. Everything else is impressive extras.

6. **Seed demo data before your presentation.** Empty screens look bad. Have demo dogs with full histories ready to show.

7. **Keep the UI clean.** shadcn/ui components look professional out of the box. Don't over-customise — just use their defaults and add your green/teal color theme.

---

*Dog Wellness Web App — v1.0 Blueprint · June 2026 · Built for dogs everywhere 🐾*
