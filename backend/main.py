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
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid input", "errors": exc.errors()},
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    print(f"🔥 Unhandled error: {exc}")  # goes to your terminal/logs
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again."},
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
from routers import mood, activity
app.include_router(mood.router, prefix="/api", tags=["mood"])
app.include_router(activity.router, prefix="/api", tags=["activity"])

# Day 15-16: Breed ID
from routers import predict
app.include_router(predict.router, prefix="/api/predict", tags=["ml"])
from routers import heat_cycles
app.include_router(heat_cycles.router, prefix="/api", tags=["reproductive"])

from routers import training_tips
app.include_router(training_tips.router, prefix="/api", tags=["training"])

from routers import toxic_foods
app.include_router(toxic_foods.router, prefix="/api", tags=["safety"])

from routers import reminders
app.include_router(reminders.router, prefix="/api", tags=["internal"])

# Day 22: Breeder — litters & puppies
from routers import litters
app.include_router(litters.router, prefix="/api", tags=["breeder"])