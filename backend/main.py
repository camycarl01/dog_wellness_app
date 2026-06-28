"""
PawCare — Dog Wellness API
FastAPI backend with Supabase auth + PostgreSQL
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# ----- App factory -----

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🐾 PawCare API starting up…")
    yield
    print("🐾 PawCare API shutting down…")

app = FastAPI(
    title="PawCare API",
    description="Dog wellness platform backend",
    version="0.1.0",
    lifespan=lifespan,
)

# ----- CORS -----
# In production, restrict to your Vercel domain
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,https://dogwellness.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Health check (no auth required) -----
@app.get("/", tags=["status"])
async def root():
    return {"status": "ok", "message": "PawCare API is running 🐾"}

@app.get("/health", tags=["status"])
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

# ----- Routers (import as you build them each day) -----
# Day 4: Dogs
from routers import dogs
app.include_router(dogs.router, prefix="/api/dogs", tags=["dogs"])

# Day 7: Vet + vaccines
from routers import vet
app.include_router(vet.router, prefix="/api", tags=["vet"])

# Day 8-10: Symptom checker + ML
from routers import symptoms
app.include_router(symptoms.router, prefix="/api", tags=["symptoms"])

# Day 11-12: Nutrition + weight
from routers import nutrition
app.include_router(nutrition.router, prefix="/api", tags=["nutrition"])

# Day 15-16: Breed ID
from routers import predict
app.include_router(predict.router, prefix="/api/predict", tags=["ml"])
