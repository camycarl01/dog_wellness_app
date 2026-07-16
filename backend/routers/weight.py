from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import WeightLogCreate
from datetime import datetime
import uuid

from breed_weight_reference import get_healthy_range, weight_status

router = APIRouter()


async def _get_owned_dog(dog_id: str, user_id: str, supabase) -> dict:
    res = (
        supabase.table("dogs")
        .select("id, breed")
        .eq("id", dog_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found")
    return res.data


@router.post("/weight-logs", status_code=status.HTTP_201_CREATED)
async def create_weight_log(
    body: WeightLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_dog(str(body.dog_id), user.id, supabase)

    data = {
        "id": str(uuid.uuid4()),
        **body.model_dump(mode="json"),
        "logged_at": (body.logged_at or datetime.utcnow()).isoformat()
        if not isinstance(body.logged_at, str) else body.logged_at,
    }
    res = supabase.table("weight_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save weight log")
    return res.data[0]


@router.get("/weight-logs/{dog_id}")
async def list_weight_logs(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    """
    Returns the full weight history PLUS the breed healthy-range band and a
    status badge computed off the most recent entry, so the frontend growth
    chart can draw the shaded reference band and badge without a second
    endpoint or duplicating the breed lookup logic client-side.
    """
    dog = await _get_owned_dog(dog_id, user.id, supabase)

    res = (
        supabase.table("weight_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=False)  # ascending, so charts can plot left-to-right without re-sorting
        .execute()
    )
    logs = res.data or []

    if not logs:
        return {
            "logs": [],
            "healthy_range_kg": None,
            "is_breed_specific_range": None,
            "current_status": None,
            "trend": None,
        }

    latest_weight = logs[-1]["weight_kg"]
    min_kg, max_kg, is_specific = get_healthy_range(dog["breed"], latest_weight)
    current_status = weight_status(latest_weight, min_kg, max_kg)

    trend = "stable"
    if len(logs) >= 2:
        previous_weight = logs[-2]["weight_kg"]
        diff = latest_weight - previous_weight
        if diff > 0.1:
            trend = "up"
        elif diff < -0.1:
            trend = "down"

    return {
        "logs": logs,
        "healthy_range_kg": {"min": min_kg, "max": max_kg},
        "is_breed_specific_range": is_specific,
        "current_status": current_status,
        "trend": trend,
    }