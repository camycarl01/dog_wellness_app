"""
Symptom checker router.
Day 8: rule-based placeholder predictor.
Day 10: swap in the Random Forest .pkl model.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, get_supabase
from schemas import SymptomLogCreate, IllnessPrediction, Severity
import uuid

router = APIRouter()

# ---------------------------------------------------------------
# RULE-BASED PLACEHOLDER — replace with ML model on Day 10
# ---------------------------------------------------------------
SYMPTOM_RULES = [
    {
        "illness": "Parvovirus",
        "required": {"vomiting", "diarrhea", "lethargy"},
        "severity": Severity.emergency,
        "recommendation": "Seek emergency veterinary care immediately. Parvovirus is life-threatening.",
    },
    {
        "illness": "Kennel cough",
        "required": {"coughing", "sneezing"},
        "severity": Severity.mild,
        "recommendation": "Rest, keep away from other dogs. See a vet if cough persists beyond 7 days.",
    },
    {
        "illness": "Ear infection",
        "required": {"scratching"},
        "severity": Severity.mild,
        "recommendation": "Schedule a vet visit within a few days for ear examination and cleaning.",
    },
    {
        "illness": "Gastroenteritis",
        "required": {"vomiting", "diarrhea"},
        "severity": Severity.moderate,
        "recommendation": "Withhold food for 12 hours, ensure hydration. See vet if symptoms persist.",
    },
    {
        "illness": "Respiratory infection",
        "required": {"coughing", "nasal_discharge"},
        "severity": Severity.moderate,
        "recommendation": "Book a vet visit within 48 hours.",
    },
    {
        "illness": "Lethargy / malaise",
        "required": {"lethargy", "loss_of_appetite"},
        "severity": Severity.moderate,
        "recommendation": "Monitor closely. See a vet if symptoms persist beyond 48 hours.",
    },
]


def rule_based_predict(symptoms: dict, duration_days: int) -> IllnessPrediction:
    active = {k for k, v in symptoms.items() if v}
    best_match = None
    best_overlap = 0

    for rule in SYMPTOM_RULES:
        overlap = len(rule["required"] & active)
        if overlap > best_overlap:
            best_overlap = overlap
            best_match = rule

    if not best_match or best_overlap == 0:
        return IllnessPrediction(
            illness="No specific illness identified",
            confidence=0.3,
            severity=Severity.mild,
            recommendation="Monitor your dog's condition. Consult a vet if symptoms worsen or persist.",
        )

    # Escalate severity if symptoms have lasted a long time
    severity = best_match["severity"]
    if duration_days >= 3 and severity == Severity.mild:
        severity = Severity.moderate

    confidence = min(0.95, best_overlap / len(best_match["required"]) * 0.85)

    return IllnessPrediction(
        illness=best_match["illness"],
        confidence=round(confidence, 2),
        severity=severity,
        recommendation=best_match["recommendation"],
    )


# ---------------------------------------------------------------
# Routes
# ---------------------------------------------------------------

@router.post("/predict/illness", response_model=IllnessPrediction)
async def predict_illness(
    body: SymptomLogCreate,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    prediction = rule_based_predict(body.symptoms, body.duration_days)

    # Save the log
    log_data = {
        "id": str(uuid.uuid4()),
        "dog_id": str(body.dog_id),
        "symptoms": body.symptoms,
        "duration_days": body.duration_days,
        "prediction": prediction.illness,
        "severity": prediction.severity.value,
        "confidence": prediction.confidence,
    }
    supabase.table("symptom_logs").insert(log_data).execute()

    return prediction


@router.get("/symptoms/{dog_id}")
async def list_symptom_logs(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    res = (
        supabase.table("symptom_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=True)
        .execute()
    )
    return res.data or []
