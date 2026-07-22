"""
FastAPI route for POST /api/predict/illness

Add to main.py:
    from routes.illness import router as illness_router
    app.include_router(illness_router, prefix="/api")

(Adjust the import path to wherever you place this file in your backend.)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict

from ml.illness.predict import predict as predict_illness
from ml.illness.illness_reference import SYMPTOM_LIST

router = APIRouter()


class SymptomCheckRequest(BaseModel):
    # Only symptoms present in this dict need to be sent; anything omitted is
    # treated as False/0 by predict.py. Frontend should still send the full
    # set of checkboxes (true/false) for clarity, but partial dicts won't crash.
    symptoms: Dict[str, bool] = Field(
        ...,
        description=f"Symptom flags. Valid keys: {SYMPTOM_LIST}",
        examples=[{"vomiting": True, "diarrhea": True, "lethargy": True}],
    )
    age_months: int = Field(..., ge=0, le=300, description="Dog's age in months")
    duration_days: int = Field(..., ge=0, le=3650, description="How many days symptoms have been present")


class SymptomCheckResponse(BaseModel):
    illness: str
    illness_confidence: float
    severity: str
    severity_model_output: str
    severity_disagreement: bool
    recommendation: str


@router.post("/predict/illness", response_model=SymptomCheckResponse)
def check_symptoms(payload: SymptomCheckRequest):
    # Reject unknown symptom keys early with a clear error, rather than
    # silently ignoring typos from the frontend (e.g. "lethagy" vs "lethargy").
    unknown_keys = set(payload.symptoms.keys()) - set(SYMPTOM_LIST)
    if unknown_keys:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown symptom key(s): {sorted(unknown_keys)}. "
                   f"Valid symptoms are: {SYMPTOM_LIST}",
        )

    result = predict_illness(
        symptoms=payload.symptoms,
        age_months=payload.age_months,
        duration_days=payload.duration_days,
    )
    return result