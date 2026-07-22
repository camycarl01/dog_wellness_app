from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import LitterCreate, PuppyCreate
from typing import List
import uuid
from fastapi.responses import StreamingResponse
from pdf_certificate import generate_puppy_certificate
from schemas import (
    LitterCreate, PuppyCreate, PuppyUpdate, PuppySoldUpdate,
    PuppyWeightLogCreate,
)

router = APIRouter()


def _get_owned_dog_ids(supabase, user_id: str) -> set:
    """Helper: all dog IDs belonging to this user (used to check litter ownership)."""
    res = supabase.table("dogs").select("id").eq("user_id", user_id).execute()
    return {row["id"] for row in (res.data or [])}


# ----- Litters -----

@router.post("/litters", status_code=status.HTTP_201_CREATED)
async def create_litter(
    body: LitterCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    # Confirm the mother dog belongs to this user
    mother_check = (
        supabase.table("dogs")
        .select("id")
        .eq("id", str(body.mother_dog_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not mother_check.data:
        raise HTTPException(status_code=404, detail="Mother dog not found")

    data = {
        "id": str(uuid.uuid4()),
        **body.model_dump(mode="json"),
    }
    res = supabase.table("litters").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create litter")
    return res.data[0]


@router.get("/litters", response_model=List[dict])
async def list_litters(
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    owned_dog_ids = _get_owned_dog_ids(supabase, user.id)
    if not owned_dog_ids:
        return []

    res = (
        supabase.table("litters")
        .select("*")
        .in_("mother_dog_id", list(owned_dog_ids))
        .execute()
    )
    return res.data or []


@router.get("/litters/{litter_id}")
async def get_litter(
    litter_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    owned_dog_ids = _get_owned_dog_ids(supabase, user.id)

    res = supabase.table("litters").select("*").eq("id", litter_id).execute()
    if not res.data or res.data[0]["mother_dog_id"] not in owned_dog_ids:
        raise HTTPException(status_code=404, detail="Litter not found")
    return res.data[0]


# ----- Puppies -----

@router.post("/puppies", status_code=status.HTTP_201_CREATED)
async def create_puppy(
    body: PuppyCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    owned_dog_ids = _get_owned_dog_ids(supabase, user.id)

    litter_check = supabase.table("litters").select("mother_dog_id").eq("id", str(body.litter_id)).execute()
    if not litter_check.data or litter_check.data[0]["mother_dog_id"] not in owned_dog_ids:
        raise HTTPException(status_code=404, detail="Litter not found")

    data = {
        "id": str(uuid.uuid4()),
        **body.model_dump(mode="json"),
    }
    res = supabase.table("puppies").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create puppy")
    return res.data[0]


@router.get("/puppies/{litter_id}", response_model=List[dict])
async def list_puppies(
    litter_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    owned_dog_ids = _get_owned_dog_ids(supabase, user.id)

    litter_check = supabase.table("litters").select("mother_dog_id").eq("id", litter_id).execute()
    if not litter_check.data or litter_check.data[0]["mother_dog_id"] not in owned_dog_ids:
        raise HTTPException(status_code=404, detail="Litter not found")

    res = supabase.table("puppies").select("*").eq("litter_id", litter_id).execute()
    return res.data or []





# ... keep everything else, add these:

@router.post("/puppies/{puppy_id}/weight-logs", status_code=status.HTTP_201_CREATED)
async def add_puppy_weight_log(
    puppy_id: str,
    body: PuppyWeightLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    owned_dog_ids = _get_owned_dog_ids(supabase, user.id)
    puppy = _puppy_belongs_to_user(supabase, puppy_id, owned_dog_ids)
    if not puppy:
        raise HTTPException(status_code=404, detail="Puppy not found")

    data = {
        "id": str(uuid.uuid4()),
        "puppy_id": puppy_id,
        **{k: v for k, v in body.model_dump(mode="json").items() if v is not None},
    }
    res = supabase.table("puppy_weight_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log weight")

    # Keep the puppy's "current weight" snapshot in sync
    supabase.table("puppies").update({"weight_kg": body.weight_kg}).eq("id", puppy_id).execute()

    return res.data[0]


@router.get("/puppies/{puppy_id}/weight-logs")
async def get_puppy_weight_logs(
    puppy_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    owned_dog_ids = _get_owned_dog_ids(supabase, user.id)
    puppy = _puppy_belongs_to_user(supabase, puppy_id, owned_dog_ids)
    if not puppy:
        raise HTTPException(status_code=404, detail="Puppy not found")

    res = (
        supabase.table("puppy_weight_logs")
        .select("*")
        .eq("puppy_id", puppy_id)
        .order("logged_at")
        .execute()
    )
    return res.data or []




# ... add alongside your other puppy routes:

@router.get("/puppies/{puppy_id}/certificate")
async def get_puppy_certificate(
    puppy_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    owned_dog_ids = _get_owned_dog_ids(supabase, user.id)
    puppy = _puppy_belongs_to_user(supabase, puppy_id, owned_dog_ids)
    if not puppy:
        raise HTTPException(status_code=404, detail="Puppy not found")

    litter_res = supabase.table("litters").select("*").eq("id", puppy["litter_id"]).execute()
    if not litter_res.data:
        raise HTTPException(status_code=404, detail="Litter not found")
    litter = litter_res.data[0]

    mother_res = supabase.table("dogs").select("*").eq("id", litter["mother_dog_id"]).execute()
    mother_dog = mother_res.data[0] if mother_res.data else {}

    user_res = supabase.table("users").select("name").eq("id", user.id).execute()
    breeder_name = user_res.data[0]["name"] if user_res.data else None

    pdf_buffer = generate_puppy_certificate(puppy, litter, mother_dog, breeder_name)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{puppy["name"]}_certificate.pdf"'}
    )