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
        # Hallmarks: haemorrhagic gastro + systemic collapse in unvaccinated puppies
        "symptoms": ["vomiting", "diarrhea", "lethargy", "loss_of_appetite", "fever",
                     "weight_loss", "nasal_discharge"],
        "primary_symptoms": ["vomiting", "diarrhea", "lethargy", "fever"],
        "age_months_range": (1, 18),
        "duration_days_range": (1, 5),
        "severity": "emergency",
    },
    {
        "illness": "kennel_cough",
        # Bordetella / parainfluenza: dry honking cough + upper respiratory
        "symptoms": ["coughing", "sneezing", "nasal_discharge", "fever", "lethargy"],
        "primary_symptoms": ["coughing", "nasal_discharge"],
        "age_months_range": (2, 200),
        "duration_days_range": (3, 21),
        "severity": "mild",
    },
    {
        "illness": "hip_dysplasia",
        # Structural — chronic, large/giant breeds, worsens with activity
        "symptoms": ["limping", "lethargy", "swelling", "weight_gain"],
        "primary_symptoms": ["limping"],
        "age_months_range": (6, 200),
        "duration_days_range": (30, 900),
        "severity": "moderate",
    },
    {
        "illness": "ear_infection",
        # Otitis externa — head shaking, pawing at ear, discharge
        "symptoms": ["scratching", "ear_discharge", "bad_breath"],
        "primary_symptoms": ["ear_discharge", "scratching"],
        "age_months_range": (2, 200),
        "duration_days_range": (2, 21),
        "severity": "mild",
    },
    {
        "illness": "gastroenteritis",
        # Acute GI upset — vomiting + diarrhoea without systemic fever
        "symptoms": ["vomiting", "diarrhea", "loss_of_appetite", "lethargy"],
        "primary_symptoms": ["vomiting", "diarrhea"],
        "age_months_range": (2, 200),
        "duration_days_range": (1, 7),
        "severity": "moderate",
    },
    {
        "illness": "osteoarthritis",
        # Degenerative joint disease — older dogs, stiffness after rest
        "symptoms": ["limping", "lethargy", "swelling", "weight_gain"],
        "primary_symptoms": ["limping", "swelling"],
        "age_months_range": (60, 200),
        "duration_days_range": (60, 900),
        "severity": "moderate",
    },
    {
        "illness": "environmental_allergies",
        # Atopy — seasonal, skin + ocular + sneezing
        "symptoms": ["scratching", "skin_redness", "eye_discharge", "sneezing",
                     "nasal_discharge", "ear_discharge"],
        "primary_symptoms": ["scratching", "skin_redness"],
        "age_months_range": (6, 200),
        "duration_days_range": (7, 360),
        "severity": "mild",
    },
    {
        "illness": "urinary_tract_infection",
        # Bacterial UTI — polydipsia, dysuria, systemic signs
        "symptoms": ["excessive_thirst", "lethargy", "loss_of_appetite", "fever",
                     "weight_loss"],
        "primary_symptoms": ["excessive_thirst", "fever"],
        "age_months_range": (6, 200),
        "duration_days_range": (2, 14),
        "severity": "moderate",
    },
    {
        "illness": "tick_borne_disease",
        # Ehrlichia/Lyme/Rocky Mountain — polyarthritis + fever + malaise
        "symptoms": ["lethargy", "fever", "limping", "loss_of_appetite",
                     "swelling", "nasal_discharge"],
        "primary_symptoms": ["fever", "limping", "lethargy"],
        "age_months_range": (2, 200),
        "duration_days_range": (3, 21),
        "severity": "severe",
    },
    {
        "illness": "heatstroke",
        # Hyperthermia — rapid onset, high temp, CNS signs
        "symptoms": ["lethargy", "vomiting", "seizure", "fever", "excessive_thirst"],
        "primary_symptoms": ["seizure", "fever", "lethargy"],
        "age_months_range": (2, 200),
        "duration_days_range": (1, 2),
        "severity": "emergency",
    },
    {
        "illness": "bloat_gdv",
        # Gastric dilatation-volvulus — deep-chested breeds, acute abdominal distension
        "symptoms": ["swelling", "lethargy", "vomiting", "loss_of_appetite"],
        "primary_symptoms": ["swelling", "vomiting"],
        "age_months_range": (24, 200),
        "duration_days_range": (1, 2),
        "severity": "emergency",
    },
    {
        "illness": "dental_disease",
        # Periodontal disease — halitosis, difficulty eating, facial swelling
        "symptoms": ["bad_breath", "loss_of_appetite", "swelling", "weight_loss"],
        "primary_symptoms": ["bad_breath", "swelling"],
        "age_months_range": (24, 200),
        "duration_days_range": (30, 900),
        "severity": "mild",
    },
    {
        "illness": "obesity_related_strain",
        # Overweight causing joint/mobility issues
        "symptoms": ["lethargy", "limping", "weight_gain"],
        "primary_symptoms": ["weight_gain", "limping"],
        "age_months_range": (24, 200),
        "duration_days_range": (60, 900),
        "severity": "mild",
    },
    {
        "illness": "anxiety_behavioral",
        # Separation/generalised anxiety — often misread as illness
        "symptoms": ["lethargy", "loss_of_appetite", "weight_loss"],
        "primary_symptoms": ["lethargy", "loss_of_appetite"],
        "age_months_range": (4, 200),
        "duration_days_range": (7, 360),
        "severity": "mild",
    },
    {
        "illness": "conjunctivitis",
        # Ocular infection/irritation — discharge, pawing at eyes
        "symptoms": ["eye_discharge", "scratching", "swelling", "nasal_discharge"],
        "primary_symptoms": ["eye_discharge"],
        "age_months_range": (2, 200),
        "duration_days_range": (2, 14),
        "severity": "mild",
    },
    {
        "illness": "mange",
        # Sarcoptic/demodectic — intense pruritus, hair loss, skin lesions
        "symptoms": ["scratching", "skin_redness", "weight_loss", "lethargy",
                     "ear_discharge"],
        "primary_symptoms": ["scratching", "skin_redness"],
        "age_months_range": (1, 120),
        "duration_days_range": (14, 180),
        "severity": "moderate",
    },
    {
        "illness": "intestinal_parasites",
        # Worms/Giardia — scooting, pot-belly in pups, GI signs
        "symptoms": ["diarrhea", "weight_loss", "loss_of_appetite", "vomiting",
                     "lethargy"],
        "primary_symptoms": ["diarrhea", "weight_loss"],
        "age_months_range": (1, 72),
        "duration_days_range": (7, 90),
        "severity": "moderate",
    },
    {
        "illness": "hypothyroidism",
        # Low thyroid — weight gain, skin/coat changes, lethargy in middle-aged dogs
        "symptoms": ["lethargy", "weight_gain", "skin_redness", "bad_breath",
                     "weight_loss"],
        "primary_symptoms": ["lethargy", "weight_gain"],
        "age_months_range": (48, 200),
        "duration_days_range": (60, 900),
        "severity": "moderate",
    },
    {
        "illness": "diabetes_mellitus",
        # Canine diabetes — polydipsia, polyuria, weight loss despite eating
        "symptoms": ["excessive_thirst", "weight_loss", "lethargy", "loss_of_appetite",
                     "bad_breath"],
        "primary_symptoms": ["excessive_thirst", "weight_loss"],
        "age_months_range": (48, 200),
        "duration_days_range": (14, 900),
        "severity": "severe",
    },
    {
        "illness": "pneumonia",
        # Lower respiratory infection — productive cough, fever, lethargy
        "symptoms": ["coughing", "fever", "lethargy", "nasal_discharge",
                     "loss_of_appetite", "weight_loss"],
        "primary_symptoms": ["coughing", "fever", "lethargy"],
        "age_months_range": (2, 200),
        "duration_days_range": (3, 21),
        "severity": "severe",
    },
    {
        "illness": "food_allergy",
        # Cutaneous adverse food reaction — chronic GI + skin
        "symptoms": ["vomiting", "diarrhea", "scratching", "skin_redness",
                     "ear_discharge", "loss_of_appetite"],
        "primary_symptoms": ["vomiting", "diarrhea", "scratching"],
        "age_months_range": (6, 200),
        "duration_days_range": (14, 900),
        "severity": "mild",
    },
    {
        "illness": "epilepsy",
        # Idiopathic epilepsy — recurrent unprovoked seizures, postictal lethargy
        "symptoms": ["seizure", "lethargy", "loss_of_appetite"],
        "primary_symptoms": ["seizure"],
        "age_months_range": (6, 200),
        "duration_days_range": (1, 900),
        "severity": "severe",
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
# Lowered from 0.40 so that strong rule-based matches are not discarded —
# the fallback scorer now returns 0.35–0.95 range, so 0.30 is the right floor.
ILLNESS_CONFIDENCE_THRESHOLD = 0.30
