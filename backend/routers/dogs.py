from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import DogCreate, DogUpdate, DogResponse
from typing import List
import uuid

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_dog(
    body: DogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    data = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        **body.model_dump(mode="json"),
    }
    res = supabase.table("dogs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create dog profile")
    return res.data[0]


@router.get("", response_model=List[dict])
async def list_dogs(
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    res = supabase.table("dogs").select("*").eq("user_id", user.id).execute()
    return res.data or []


@router.get("/{dog_id}")
async def get_dog(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    res = supabase.table("dogs").select("*").eq("id", dog_id).eq("user_id", user.id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found")
    return res.data


@router.put("/{dog_id}")
async def update_dog(
    dog_id: str,
    body: DogUpdate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    # Only update fields that were actually provided
    updates = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    res = (
        supabase.table("dogs")
        .update(updates)
        .eq("id", dog_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found or no changes made")
    return res.data[0]


@router.delete("/{dog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dog(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    supabase.table("dogs").delete().eq("id", dog_id).eq("user_id", user.id).execute()
