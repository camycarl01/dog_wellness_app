from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import FeedingLogCreate, FeedingRecommendation
from datetime import date
import uuid

router = APIRouter()


def _age_in_months(dob) -> int:
    if isinstance(dob, str):
        dob = date.fromisoformat(dob)
    today = date.today()
    months = (today.year - dob.year) * 12 + (today.month - dob.month)
    if today.day < dob.day:
        months -= 1
    return max(0, months)


def _activity_factor(age_months: int, is_neutered: bool) -> tuple[float, str]:
    """
    Returns (multiplier, human-readable reason) using standard veterinary
    MER (Maintenance Energy Requirement) multipliers applied to RER.

    Based on age + neuter status only, since that's what the dogs table
    actually stores today. If an explicit activity_level field gets added
    later (blueprint mentions this for the ML feeding model on Day 17),
    this should take that into account too instead of just age/neuter.
    """
    if age_months < 4:
        return 3.0, "puppy under 4 months (rapid growth)"
    if age_months < 12:
        return 2.0, "puppy 4-12 months (growth)"
    if age_months >= 84:  # 7 years+, treated as senior
        return 1.4, "senior dog (7+ years, lower activity assumed)"
    if is_neutered:
        return 1.6, "neutered/spayed adult"
    return 1.8, "intact adult"


def _weight_bracket(weight_kg: float) -> str:
    """Purely descriptive -- not used in the RER math, just shown to the user."""
    if weight_kg < 5:
        return "toy"
    if weight_kg < 10:
        return "small"
    if weight_kg < 25:
        return "medium"
    if weight_kg < 45:
        return "large"
    return "giant"


def _calculate_feeding(weight_kg: float, age_months: int, is_neutered: bool) -> FeedingRecommendation:
    if weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Dog weight must be greater than 0 to calculate feeding")

    rer = 70 * (weight_kg ** 0.75)
    factor, reason = _activity_factor(age_months, is_neutered)
    kcal_per_day = rer * factor

    # Grams/day depends on the food's kcal density, which varies by brand.
    # Using a common dry-kibble average (~3.5 kcal/g) as a reasonable default
    # since no food-specific data exists yet. This should be flagged to the
    # user as an estimate, not treated as precise for every food brand.
    ASSUMED_KCAL_PER_GRAM = 3.5
    grams_per_day = kcal_per_day / ASSUMED_KCAL_PER_GRAM

    meals_per_day = 3 if age_months < 6 else 2
    grams_per_meal = grams_per_day / meals_per_day

    bracket = _weight_bracket(weight_kg)
    notes = (
        f"Estimated for a {bracket}-size dog ({reason}). "
        f"Assumes ~{ASSUMED_KCAL_PER_GRAM} kcal/g (typical dry kibble) -- "
        f"check your specific food's label, as kcal density varies by brand."
    )

    return FeedingRecommendation(
        kcal_per_day=round(kcal_per_day, 1),
        grams_per_day=round(grams_per_day, 1),
        meals_per_day=meals_per_day,
        grams_per_meal=round(grams_per_meal, 1),
        notes=notes,
    )


async def _get_owned_dog(dog_id: str, user_id: str, supabase) -> dict:
    res = (
        supabase.table("dogs")
        .select("id, dob, weight_kg, is_neutered")
        .eq("id", dog_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found")
    return res.data


# ----- Routes -----

@router.get("/feeding-recommendation/{dog_id}", response_model=FeedingRecommendation)
async def get_feeding_recommendation(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    dog = await _get_owned_dog(dog_id, user.id, supabase)

    if dog.get("weight_kg") is None:
        raise HTTPException(status_code=400, detail="Dog has no weight_kg on file yet")

    age_months = _age_in_months(dog["dob"])
    return _calculate_feeding(dog["weight_kg"], age_months, dog.get("is_neutered", False))


@router.post("/feeding-logs", status_code=status.HTTP_201_CREATED)
async def create_feeding_log(
    body: FeedingLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_dog(str(body.dog_id), user.id, supabase)

    data = {
        "id": str(uuid.uuid4()),
        **body.model_dump(mode="json"),
    }
    res = supabase.table("feeding_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save feeding log")
    return res.data[0]


@router.get("/feeding-logs/{dog_id}")
async def list_feeding_logs(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_dog(dog_id, user.id, supabase)
    res = (
        supabase.table("feeding_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=True)
        .execute()
    )
    return res.data or []