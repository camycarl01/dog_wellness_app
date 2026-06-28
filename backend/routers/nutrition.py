"""
Nutrition router.
Feeding recommendation uses rule-based calculator now;
XGBoost model plugs in on Day 17.
"""
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, get_supabase
from schemas import FeedingLogCreate, FeedingRecommendation, WeightLogCreate
from datetime import datetime
import uuid

router = APIRouter()

# ---------------------------------------------------------------
# Rule-based feeding calculator (AKC breed standards)
# ---------------------------------------------------------------
def compute_feeding(weight_kg: float, age_months: int, activity: str = "moderate") -> FeedingRecommendation:
    """
    Returns daily kcal and grams recommendation.
    activity: 'low' | 'moderate' | 'high'
    """
    # Base kcal per kg by weight class
    if weight_kg < 5:
        base_kcal_per_kg = 110  # Toy breeds
    elif weight_kg < 10:
        base_kcal_per_kg = 85   # Small breeds
    elif weight_kg < 25:
        base_kcal_per_kg = 70   # Medium breeds
    elif weight_kg < 45:
        base_kcal_per_kg = 60   # Large breeds
    else:
        base_kcal_per_kg = 50   # Giant breeds

    # Age multipliers
    if age_months < 4:
        age_multiplier = 2.0    # Puppies under 4 months
    elif age_months < 12:
        age_multiplier = 1.5    # Growing puppies
    elif age_months > 84:       # 7+ years = senior
        age_multiplier = 0.85
    else:
        age_multiplier = 1.0

    # Activity multipliers
    activity_multiplier = {"low": 0.8, "moderate": 1.0, "high": 1.2}.get(activity, 1.0)

    kcal_per_day = weight_kg * base_kcal_per_kg * age_multiplier * activity_multiplier

    # Average dry kibble: ~350 kcal per 100g
    grams_per_day = (kcal_per_day / 350) * 100

    # Meals per day by age
    meals_per_day = 3 if age_months < 6 else 2

    notes_parts = []
    if age_months < 12:
        notes_parts.append("growing puppy portions")
    if age_months > 84:
        notes_parts.append("senior dog — reduced calorie needs")
    if activity == "high":
        notes_parts.append("active lifestyle — monitor weight monthly")
    notes = "; ".join(notes_parts) or "Standard adult maintenance formula"

    return FeedingRecommendation(
        kcal_per_day=round(kcal_per_day, 1),
        grams_per_day=round(grams_per_day, 1),
        meals_per_day=meals_per_day,
        grams_per_meal=round(grams_per_day / meals_per_day, 1),
        notes=notes.capitalize(),
    )


# ---------------------------------------------------------------
# Routes
# ---------------------------------------------------------------

@router.get("/feeding-recommendation/{dog_id}", response_model=FeedingRecommendation)
async def get_feeding_recommendation(
    dog_id: str,
    activity: str = "moderate",
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    # Fetch the dog
    res = supabase.table("dogs").select("weight_kg, dob").eq("id", dog_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found")

    dog = res.data
    from datetime import date
    dob = date.fromisoformat(dog["dob"])
    age_months = (date.today().year - dob.year) * 12 + (date.today().month - dob.month)

    return compute_feeding(dog["weight_kg"], age_months, activity)


@router.post("/feeding-logs", status_code=201)
async def log_meal(
    body: FeedingLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    data = {
        "id": str(uuid.uuid4()),
        "logged_at": datetime.utcnow().isoformat(),
        **body.model_dump(mode="json"),
    }
    res = supabase.table("feeding_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log meal")
    return res.data[0]


@router.get("/feeding-logs/{dog_id}")
async def list_feeding_logs(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    res = (
        supabase.table("feeding_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data or []


# ----- Weight logs -----

@router.post("/weight-logs", status_code=201)
async def log_weight(
    body: WeightLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    data = {
        "id": str(uuid.uuid4()),
        "logged_at": (body.logged_at or datetime.utcnow()).isoformat(),
        "dog_id": str(body.dog_id),
        "weight_kg": body.weight_kg,
    }
    res = supabase.table("weight_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log weight")
    return res.data[0]


@router.get("/weight-logs/{dog_id}")
async def list_weight_logs(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    res = (
        supabase.table("weight_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=False)
        .execute()
    )
    return res.data or []
