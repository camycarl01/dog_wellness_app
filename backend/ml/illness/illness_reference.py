"""
Illness reference table for the dog symptom checker ML model.

IMPORTANT: This is a simplified, illustrative reference for a student/portfolio
project ML model. It is NOT a clinically validated dataset and should never be
presented as diagnostic. General patterns are based on commonly cited
veterinary overview information (AKC / Merck Veterinary Manual style summaries),
but symptom sets have been simplified and are not a substitute for real
veterinary/clinical data.

Fixed symptom vocabulary (used across the whole project so the frontend
checkboxes, backend API, and model all agree on the same feature names):
"""

SYMPTOM_LIST = [
    "lethargy",
    "vomiting",
    "diarrhea",
    "loss_of_appetite",
    "coughing",
    "sneezing",
    "nasal_discharge",
    "limping",
    "scratching",
    "ear_discharge",
    "eye_discharge",
    "swelling",
    "seizure",
    "fever",
    "excessive_thirst",
    "weight_loss",
    "weight_gain",
    "bad_breath",
    "skin_redness",
]

# Each illness: canonical symptoms, typical age range (months), typical
# duration range (days) as reported before a checkup, and severity label.
ILLNESS_TABLE = [
    {
        "illness": "parvovirus",
        "symptoms": ["vomiting", "diarrhea", "lethargy", "loss_of_appetite", "fever"],
        "age_months_range": (2, 12),
        "duration_days_range": (1, 4),
        "severity": "emergency",
    },
    {
        "illness": "kennel_cough",
        "symptoms": ["coughing", "sneezing", "nasal_discharge"],
        "age_months_range": (2, 180),
        "duration_days_range": (2, 14),
        "severity": "mild",
    },
    {
        "illness": "hip_dysplasia",
        "symptoms": ["limping", "lethargy"],
        "age_months_range": (6, 180),
        "duration_days_range": (30, 720),
        "severity": "moderate",
    },
    {
        "illness": "ear_infection",
        "symptoms": ["scratching", "ear_discharge"],
        "age_months_range": (2, 180),
        "duration_days_range": (2, 14),
        "severity": "mild",
    },
    {
        "illness": "gastroenteritis",
        "symptoms": ["vomiting", "diarrhea", "loss_of_appetite"],
        "age_months_range": (2, 180),
        "duration_days_range": (1, 5),
        "severity": "moderate",
    },
    {
        "illness": "osteoarthritis",
        "symptoms": ["limping", "lethargy", "swelling"],
        "age_months_range": (60, 200),
        "duration_days_range": (60, 900),
        "severity": "moderate",
    },
    {
        "illness": "environmental_allergies",
        "symptoms": ["scratching", "skin_redness", "eye_discharge", "sneezing"],
        "age_months_range": (6, 180),
        "duration_days_range": (7, 180),
        "severity": "mild",
    },
    {
        "illness": "urinary_tract_infection",
        "symptoms": ["excessive_thirst", "lethargy", "loss_of_appetite", "fever"],
        "age_months_range": (6, 200),
        "duration_days_range": (2, 10),
        "severity": "moderate",
    },
    {
        "illness": "tick_borne_disease",
        "symptoms": ["lethargy", "fever", "limping", "loss_of_appetite"],
        "age_months_range": (2, 200),
        "duration_days_range": (3, 21),
        "severity": "severe",
    },
    {
        "illness": "heatstroke",
        "symptoms": ["lethargy", "vomiting", "seizure", "fever"],
        "age_months_range": (2, 200),
        "duration_days_range": (1, 1),
        "severity": "emergency",
    },
    {
        "illness": "bloat_gdv",
        "symptoms": ["swelling", "lethargy", "vomiting"],
        "age_months_range": (24, 200),
        "duration_days_range": (1, 1),
        "severity": "emergency",
    },
    {
        "illness": "dental_disease",
        "symptoms": ["bad_breath", "loss_of_appetite", "swelling"],
        "age_months_range": (36, 200),
        "duration_days_range": (30, 900),
        "severity": "mild",
    },
    {
        "illness": "obesity_related_strain",
        "symptoms": ["lethargy", "limping", "weight_gain"],
        "age_months_range": (24, 200),
        "duration_days_range": (60, 900),
        "severity": "mild",
    },
    {
        "illness": "anxiety_behavioral",
        "symptoms": ["lethargy", "loss_of_appetite"],
        "age_months_range": (2, 200),
        "duration_days_range": (7, 180),
        "severity": "mild",
    },
    {
        "illness": "conjunctivitis",
        "symptoms": ["eye_discharge", "scratching"],
        "age_months_range": (2, 200),
        "duration_days_range": (2, 10),
        "severity": "mild",
    },
    {
        "illness": "mange",
        "symptoms": ["scratching", "skin_redness", "weight_loss"],
        "age_months_range": (2, 120),
        "duration_days_range": (14, 90),
        "severity": "moderate",
    },
    {
        "illness": "intestinal_parasites",
        "symptoms": ["diarrhea", "weight_loss", "loss_of_appetite", "vomiting"],
        "age_months_range": (1, 60),
        "duration_days_range": (7, 60),
        "severity": "moderate",
    },
    {
        "illness": "hypothyroidism",
        "symptoms": ["lethargy", "weight_loss", "skin_redness", "bad_breath"],
        "age_months_range": (48, 200),
        "duration_days_range": (60, 900),
        "severity": "moderate",
    },
]

ILLNESSES = [row["illness"] for row in ILLNESS_TABLE]

# Ordered from least to most urgent -- used to reconcile disagreements between
# the illness model's implied severity and the severity model's direct output.
SEVERITIES = ["mild", "moderate", "severe", "emergency"]
SEVERITY_RANK = {s: i for i, s in enumerate(SEVERITIES)}

# Lookup: illness name -> its reference-table severity. Used at inference time
# to check whether the severity model's prediction is more or less urgent than
# what this illness is documented as, so the app can flag disagreement instead
# of silently showing an inconsistent result.
ILLNESS_TO_SEVERITY = {row["illness"]: row["severity"] for row in ILLNESS_TABLE}

# Below this confidence, the illness prediction is treated as inconclusive.
ILLNESS_CONFIDENCE_THRESHOLD = 0.40
