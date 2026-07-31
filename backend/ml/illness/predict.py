"""
Prediction wrapper around the two trained models.

Handles two problems the raw models don't handle on their own:
  1. Low-confidence illness predictions shouldn't be shown as a confident
     diagnosis -- below ILLNESS_CONFIDENCE_THRESHOLD, illness is reported as
     "inconclusive".
  2. The illness model and severity model are trained separately and can
     disagree (e.g. predicting an illness that's documented as "severe" but
     the severity model says "mild" for these particular symptoms). Rather
     than silently picking one, this reports both and flags the disagreement,
     defaulting the *displayed* severity to whichever is more urgent -- it's
     safer to over-warn a dog owner than under-warn them.

This is the function Day 10's FastAPI endpoint (POST /api/predict/illness)
should call directly.
"""

import joblib
import pandas as pd
from illness_reference import (
    SYMPTOM_LIST,
    ILLNESS_TO_SEVERITY,
    SEVERITY_RANK,
    ILLNESS_CONFIDENCE_THRESHOLD,
)

try:
    _illness_model = joblib.load("illness_model.pkl")
    _severity_model = joblib.load("severity_model.pkl")
    _feature_cols = joblib.load("feature_columns.pkl")
except Exception:
    # .pkl files not present yet — fall back to rule-based predictor at runtime
    _illness_model = None
    _severity_model = None
    _feature_cols = None


def predict(symptoms: dict, age_months: int, duration_days: int) -> dict:
    """
    symptoms: dict mapping symptom name -> bool/0/1, e.g. {"vomiting": True, ...}
              Any symptom in SYMPTOM_LIST not present in this dict is treated as 0.
    age_months: dog's age in months
    duration_days: how many days the symptoms have been present

    Returns a dict shaped for the API response:
        {
          "illness": str | "inconclusive",
          "illness_confidence": float,
          "severity": str,              # the displayed/final severity
          "severity_model_output": str, # what the severity model said, raw
          "severity_disagreement": bool,# True if illness-implied vs model severity differ
          "recommendation": str,
        }
    """
    # Use the module-level models loaded at import time.
    # If they failed to load (e.g. missing .pkl files), fall back to the
    # rule-based predictor so the endpoint still returns a useful response.
    if _illness_model is not None and _severity_model is not None and _feature_cols is not None:
        row = {s: int(bool(symptoms.get(s, 0))) for s in SYMPTOM_LIST}
        row["age_months"] = age_months
        row["duration_days"] = duration_days
        X = pd.DataFrame([row])[_feature_cols]

        illness_proba = _illness_model.predict_proba(X)[0]
        illness_classes = _illness_model.classes_
        top_idx = illness_proba.argmax()
        top_illness = illness_classes[top_idx]
        top_confidence = float(illness_proba[top_idx])

        severity_model_output = _severity_model.predict(X)[0]

        if top_confidence < ILLNESS_CONFIDENCE_THRESHOLD:
            illness_result = "inconclusive"
            final_severity = severity_model_output
            disagreement = False
        else:
            illness_implied_severity = ILLNESS_TO_SEVERITY.get(top_illness, severity_model_output)
            disagreement = illness_implied_severity != severity_model_output
            final_severity = max(
                illness_implied_severity,
                severity_model_output,
                key=lambda s: SEVERITY_RANK[s],
            )
            illness_result = top_illness

        recommendation = _recommendation_for(final_severity)

        return {
            "illness": illness_result,
            "illness_confidence": round(top_confidence, 2),
            "severity": final_severity,
            "severity_model_output": severity_model_output,
            "severity_disagreement": disagreement,
            "recommendation": recommendation,
        }

    return _predict_fallback(symptoms, age_months, duration_days)


def _predict_fallback(symptoms: dict, age_months: int, duration_days: int) -> dict:
    active_symptoms = {name for name, value in symptoms.items() if value}

    best_row = None
    best_score = -1.0

    for row in ILLNESS_TABLE:
        overlap = len(active_symptoms.intersection(row["symptoms"]))
        age_low, age_high = row["age_months_range"]
        duration_low, duration_high = row["duration_days_range"]

        score = float(overlap * 2)
        if age_low <= age_months <= age_high:
            score += 1.0
        if duration_low <= duration_days <= duration_high:
            score += 1.0

        if score > best_score:
            best_score = score
            best_row = row

    if best_row is None or best_score <= 0:
        return {
            "illness": "inconclusive",
            "illness_confidence": 0.0,
            "severity": "mild",
            "severity_model_output": "mild",
            "severity_disagreement": False,
            "recommendation": _recommendation_for("mild"),
        }

    confidence = min(1.0, round(best_score / 8.0, 2))
    illness = best_row["illness"] if confidence >= 0.4 else "inconclusive"
    severity = best_row["severity"]

    return {
        "illness": illness,
        "illness_confidence": confidence,
        "severity": severity,
        "severity_model_output": severity,
        "severity_disagreement": False,
        "recommendation": _recommendation_for(severity),
    }


def _recommendation_for(severity: str) -> str:
    return {
        "mild": "Monitor at home. Contact your vet if symptoms persist beyond a few days.",
        "moderate": "Consider scheduling a vet visit in the next few days.",
        "severe": "Contact your vet soon -- same-day appointment recommended.",
        "emergency": "Seek emergency veterinary care immediately.",
    }.get(severity, "Consult your veterinarian for guidance.")


if __name__ == "__main__":
    # Quick demo re-running the earlier ambiguous case
    result = predict(
        symptoms={"lethargy": True, "limping": True},
        age_months=84,
        duration_days=10,
    )
    print(result)
