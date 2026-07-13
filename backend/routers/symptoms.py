from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import SymptomLogCreate, Severity
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter()

# ----- Rule-based placeholder "model" (Day 8-9, real ML comes Day 9-10) -----

ILLNESS_PROFILES = [
    {"illness": "Parvovirus", "symptoms": {"vomiting", "diarrhea", "lethargy", "loss_of_appetite"}, "severity": Severity.emergency,
     "recommendation": "Highly contagious and dangerous, especially in puppies. See a vet immediately."},
    {"illness": "Gastroenteritis", "symptoms": {"vomiting", "diarrhea"}, "severity": Severity.moderate,
     "recommendation": "Monitor hydration closely. See a vet if symptoms persist beyond 24 hours."},
    {"illness": "Kennel cough", "symptoms": {"coughing", "sneezing", "nasal_discharge"}, "severity": Severity.mild,
     "recommendation": "Usually mild and self-limiting. Keep away from other dogs and monitor."},
    {"illness": "Hip dysplasia", "symptoms": {"limping", "lethargy"}, "severity": Severity.moderate,
     "recommendation": "Schedule a vet visit for a joint evaluation, especially if limping persists."},
    {"illness": "Ear infection", "symptoms": {"scratching", "swelling"}, "severity": Severity.mild,
     "recommendation": "Check the ears for odor or discharge. A vet visit can confirm and treat quickly."},
    {"illness": "Conjunctivitis", "symptoms": {"eye_discharge", "swelling"}, "severity": Severity.mild,
     "recommendation": "Keep the eye area clean. See a vet if discharge worsens or vision seems affected."},
    {"illness": "Allergic reaction", "symptoms": {"swelling", "scratching", "eye_discharge"}, "severity": Severity.moderate,
     "recommendation": "Watch for facial swelling or difficulty breathing — those need emergency care."},
    {"illness": "Seizure disorder", "symptoms": {"seizure", "lethargy"}, "severity": Severity.emergency,
     "recommendation": "Any seizure warrants a vet call. Note the duration and what happened before/after."},
]

FALLBACK = {
    "illness": "Unable to determine",
    "severity": Severity.mild,
    "recommendation": "Not enough matching symptoms to suggest a likely cause. Monitor your dog and check again if symptoms develop.",
}


def _predict(symptoms: dict, duration_days: int, temperature: float | None):
    selected = {k for k, v in symptoms.items() if v}

    if not selected:
        return FALLBACK["illness"], 0.0, FALLBACK["severity"], FALLBACK["recommendation"]

    scored = []
    for profile in ILLNESS_PROFILES:
        overlap = selected & profile["symptoms"]
        if not overlap:
            continue
        score = len(overlap) / len(profile["symptoms"])
        scored.append((score, profile))

    if not scored:
        return FALLBACK["illness"], 0.0, FALLBACK["severity"], FALLBACK["recommendation"]

    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best = scored[0]

    # jitter so repeated identical inputs don't always look robotic
    confidence = min(0.95, max(0.35, best_score + random.uniform(-0.05, 0.1)))

    severity = best["severity"]
    # bump severity if symptoms have lasted a while or fever is high
    if duration_days >= 7 and severity == Severity.mild:
        severity = Severity.moderate
    if temperature is not None and temperature >= 39.5 and severity in (Severity.mild, Severity.moderate):
        severity = Severity.severe

    return best["illness"], round(confidence, 2), severity, best["recommendation"]


async def _verify_dog_ownership(dog_id: str, user_id: str, supabase):
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


# ----- Routes -----

@router.post("/predict/illness", status_code=status.HTTP_201_CREATED)
async def create_symptom_log(
    body: SymptomLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    await _verify_dog_ownership(str(body.dog_id), user.id, supabase)

    illness, confidence, severity, recommendation = _predict(
        body.symptoms, body.duration_days, body.temperature
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
    await _verify_dog_ownership(dog_id, user.id, supabase)
    res = (
        supabase.table("symptom_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=True)
        .execute()
    )
    return res.data or []