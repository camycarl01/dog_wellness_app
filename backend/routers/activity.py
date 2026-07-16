from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import ActivityLogCreate
from datetime import datetime
import uuid

router = APIRouter()


async def _get_owned_dog(dog_id: str, user_id: str, supabase) -> dict:
    res = (
        supabase.table("dogs")
        .select("id")
        .eq("id", dog_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found")
    return res.data


@router.post("/activity-logs", status_code=status.HTTP_201_CREATED)
async def create_activity_log(
    body: ActivityLogCreate,
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
    res = supabase.table("activity_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save activity log")
    return res.data[0]


@router.get("/activity-logs/{dog_id}")
async def list_activity_logs(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_dog(dog_id, user.id, supabase)
    res = (
        supabase.table("activity_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=False)
        .execute()
    )
    return res.data or []