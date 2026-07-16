from fastapi import APIRouter
from typing import Optional
import json
import os

router = APIRouter()

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_FOODS_PATH = os.path.join(_THIS_DIR, "..", "content", "toxic_foods.json")

with open(_FOODS_PATH) as f:
    _ALL_FOODS = json.load(f)


@router.get("/toxic-foods")
async def search_toxic_foods(search: Optional[str] = None):
    """
    No auth required -- this is static safety reference content, not user
    data. Search matches against the food name (case-insensitive, partial
    match) so "chocolate" finds "Chocolate (all types)".

    With no search term, returns the full list.
    """
    if not search:
        return {"count": len(_ALL_FOODS), "foods": _ALL_FOODS}

    search_lower = search.lower()
    results = [f for f in _ALL_FOODS if search_lower in f["name"].lower()]

    return {"count": len(results), "foods": results}