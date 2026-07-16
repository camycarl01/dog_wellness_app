from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import os

router = APIRouter()

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_TIPS_PATH = os.path.join(_THIS_DIR, "..", "content", "training_tips.json")

with open(_TIPS_PATH) as f:
    _ALL_TIPS = json.load(f)

VALID_AGE_GROUPS = {"puppy", "adult"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}


def _age_group_for_months(age_months: Optional[int]) -> Optional[str]:
    """
    Maps a dog's age in months to 'puppy' or 'adult' for filtering.
    Rough cutoff: under 12 months = puppy, matching common usage (though
    breed size affects true maturity -- this is a simplification for
    content filtering, not a veterinary claim).
    """
    if age_months is None:
        return None
    return "puppy" if age_months < 12 else "adult"


@router.get("/training-tips")
async def get_training_tips(
    command: Optional[str] = None,
    age_months: Optional[int] = None,
    difficulty: Optional[str] = None,
):
    """
    No auth required -- this is static reference content, not user data.

    Filters are all optional and combine with AND logic:
      - command: matches against the tip's command field (case-insensitive,
        partial match so "leave" matches "leave it")
      - age_months: converted to age_group ('puppy'/'adult') and filtered
      - difficulty: exact match against 'beginner'/'intermediate'/'advanced'
    With no filters, returns all tips.
    """
    if difficulty is not None and difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid difficulty '{difficulty}'. Must be one of: {sorted(VALID_DIFFICULTIES)}",
        )

    results = _ALL_TIPS

    if command:
        command_lower = command.lower()
        results = [t for t in results if command_lower in t["command"].lower()]

    age_group = _age_group_for_months(age_months)
    if age_group:
        results = [t for t in results if t["age_group"] == age_group]

    if difficulty:
        results = [t for t in results if t["difficulty"] == difficulty]

    return {"count": len(results), "tips": results}