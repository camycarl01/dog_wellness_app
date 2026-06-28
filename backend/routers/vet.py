from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import VetVisitCreate, VaccineCreate
from datetime import date, timedelta
from typing import List
import uuid

router = APIRouter()


# ----- Vet visits -----

@router.post("/vet-visits", status_code=status.HTTP_201_CREATED)
async def create_vet_visit(
    body: VetVisitCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    data = {"id": str(uuid.uuid4()), **body.model_dump(mode="json")}
    res = supabase.table("vet_visits").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create vet visit")
    return res.data[0]


@router.get("/vet-visits/{dog_id}")
async def list_vet_visits(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    res = (
        supabase.table("vet_visits")
        .select("*")
        .eq("dog_id", dog_id)
        .order("visit_date", desc=True)
        .execute()
    )
    return res.data or []


# ----- Vaccines -----

def _compute_status(next_due_date: date) -> str:
    today = date.today()
    if next_due_date < today:
        return "overdue"
    elif next_due_date <= today + timedelta(days=30):
        return "due_soon"
    return "up_to_date"


@router.post("/vaccines", status_code=status.HTTP_201_CREATED)
async def create_vaccine(
    body: VaccineCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    data = {
        "id": str(uuid.uuid4()),
        **body.model_dump(mode="json"),
        "status": _compute_status(body.next_due_date),
    }
    res = supabase.table("vaccines").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create vaccine record")
    return res.data[0]


@router.get("/vaccines/{dog_id}")
async def list_vaccines(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    res = (
        supabase.table("vaccines")
        .select("*")
        .eq("dog_id", dog_id)
        .order("given_date", desc=True)
        .execute()
    )
    # Recompute status live (in case due dates have passed since last save)
    records = res.data or []
    for r in records:
        r["status"] = _compute_status(date.fromisoformat(r["next_due_date"]))
    return records
