from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import SymptomLogCreate, Severity
from datetime import datetime, date
import uuid

from ml.illness.predict import predict as predict_illness
from ml.illness.illness_reference import SYMPTOM_LIST

router = APIRouter()


def _age_in_months(dob: str | date) -> int:
    """
    Converts a dog's date of birth (string 'YYYY-MM-DD' or date object) into
    age in whole months, as of today. Used as a direct input feature for the
    ML model -- NOT a placeholder anymore (see history: a hardcoded age of 48
    months was masking real predictions, e.g. making puppy-typical illnesses
    like parvovirus impossible to predict for actual puppies).
    """
    if isinstance(dob, str):
        dob = date.fromisoformat(dob)
    today = date.today()
    months = (today.year - dob.year) * 12 + (today.month - dob.month)
    if today.day < dob.day:
        months -= 1
    return max(0, months)


def _predict(symptoms: dict, age_months: int, duration_days: int, temperature: float | None):
    """
    Runs the trained Random Forest illness + severity models.

    Returns the same 4-tuple shape the old rule-based version returned, so
    the rest of this file (Supabase insert, response shaping) didn't need to
    change: (illness, confidence, severity, recommendation)

    `temperature` isn't used by the ML model (it wasn't part of the training
    features) -- kept as a parameter for API compatibility, but currently
    has no effect. If a real thermometer reading should influence severity,
    that needs to be added as a training feature later, distinct from the
    "fever" checkbox symptom the model already uses.
    """
    unknown_keys = set(symptoms.keys()) - set(SYMPTOM_LIST)
    if unknown_keys:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown symptom key(s): {sorted(unknown_keys)}. "
                   f"Valid symptoms are: {SYMPTOM_LIST}",
        )

    result = predict_illness(
        symptoms=symptoms,
        age_months=age_months,
        duration_days=duration_days,
    )

    illness = result["illness"]
    confidence = result["illness_confidence"]
    severity = Severity(result["severity"])
    recommendation = result["recommendation"]

    return illness, confidence, severity, recommendation


async def _get_owned_dog(dog_id: str, user_id: str, supabase) -> dict:
    """
    Verifies the dog belongs to the requesting user AND returns the dog's
    row data, so callers (like create_symptom_log) can read fields such as
    dob without a second Supabase round-trip.
    """
    res = (
        supabase.table("dogs")
        .select("id, dob")
        .eq("id", dog_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Dog not found")
    return res.data


# ----- Routes -----

@router.post("/predict/illness", status_code=status.HTTP_201_CREATED)
async def create_symptom_log(
    body: SymptomLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    dog = await _get_owned_dog(str(body.dog_id), user.id, supabase)
    age_months = _age_in_months(dog["dob"])

    illness, confidence, severity, recommendation = _predict(
        body.symptoms, age_months, body.duration_days, body.temperature
    )

    data = {
        "id": str(uuid.uuid4()),
        **body.model_dump(mode="json"),
        "logged_at": datetime.utcnow().isoformat(),
        "prediction": illness,
        "severity": severity.value,
        "confidence": confidence,
    }
    res = supabase.table("symptom_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save symptom check")

    saved = res.data[0]
    saved["recommendation"] = recommendation  # not persisted, just returned for the result page
    return saved


@router.get("/predict/illness/{dog_id}")
async def list_symptom_logs(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _get_owned_dog(dog_id, user.id, supabase)
    res = (
        supabase.table("symptom_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=True)
        .execute()
    )
    return res.data or []