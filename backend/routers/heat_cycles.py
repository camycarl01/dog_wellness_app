from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import HeatCycleCreate
from datetime import date, timedelta
import uuid

router = APIRouter()

# Breeding window: fertile days typically fall around day 9-14 after the
# start of a heat cycle. This is a general guideline, not a precise
# biological prediction -- individual dogs vary, and this should be
# presented to the user as a starting reference, not a guarantee.
BREEDING_WINDOW_START_DAY = 9
BREEDING_WINDOW_END_DAY = 14


async def _get_owned_intact_female_dog(dog_id: str, user_id: str, supabase) -> dict:
    """
    Verifies dog ownership AND that the dog is a non-neutered female --
    heat cycle tracking is only medically meaningful for intact females.
    Rejected at the backend rather than left to the frontend, since API
    calls can bypass frontend-only checks.
    """
    res = (
        supabase.table("dogs")
        .select("id, sex, is_neutered")
        .eq("id", dog_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found")

    dog = res.data
    if dog.get("sex") != "female" or dog.get("is_neutered"):
        raise HTTPException(
            status_code=400,
            detail="Heat cycle tracking is only available for non-neutered female dogs.",
        )
    return dog


@router.post("/heat-cycles", status_code=status.HTTP_201_CREATED)
async def create_heat_cycle(
    body: HeatCycleCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_intact_female_dog(str(body.dog_id), user.id, supabase)

    data = {
        "id": str(uuid.uuid4()),
        **body.model_dump(mode="json"),
    }
    res = supabase.table("heat_cycles").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save heat cycle")
    return res.data[0]


@router.get("/heat-cycles/{dog_id}")
async def list_heat_cycles(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_intact_female_dog(dog_id, user.id, supabase)
    res = (
        supabase.table("heat_cycles")
        .select("*")
        .eq("dog_id", dog_id)
        .order("start_date", desc=False)
        .execute()
    )
    return res.data or []


@router.get("/predict/next-cycle/{dog_id}")
async def predict_next_cycle(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_intact_female_dog(dog_id, user.id, supabase)

    res = (
        supabase.table("heat_cycles")
        .select("*")
        .eq("dog_id", dog_id)
        .order("start_date", desc=False)
        .execute()
    )
    cycles = res.data or []

    if len(cycles) < 2:
        return {
            "predicted_start": None,
            "breeding_window_start": None,
            "breeding_window_end": None,
            "average_cycle_days": None,
            "message": (
                "Not enough data to predict the next cycle yet. "
                "At least 2 recorded heat cycles are needed to calculate "
                "an average interval."
            ),
        }

    start_dates = sorted(
        date.fromisoformat(c["start_date"]) if isinstance(c["start_date"], str) else c["start_date"]
        for c in cycles
    )

    intervals = [
        (start_dates[i + 1] - start_dates[i]).days
        for i in range(len(start_dates) - 1)
    ]
    average_cycle_days = round(sum(intervals) / len(intervals))

    last_start = start_dates[-1]
    predicted_start = last_start + timedelta(days=average_cycle_days)
    breeding_window_start = predicted_start + timedelta(days=BREEDING_WINDOW_START_DAY)
    breeding_window_end = predicted_start + timedelta(days=BREEDING_WINDOW_END_DAY)

    return {
        "predicted_start": predicted_start.isoformat(),
        "breeding_window_start": breeding_window_start.isoformat(),
        "breeding_window_end": breeding_window_end.isoformat(),
        "average_cycle_days": average_cycle_days,
        "message": None,
    }