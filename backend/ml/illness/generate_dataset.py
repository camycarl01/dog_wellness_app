"""
Generates a synthetic dog-illness training dataset from the illness reference
table. Designed to run in Google Colab or locally.

Usage:
    python generate_dataset.py

Output:
    dog_illness_dataset.csv
"""

import random
import pandas as pd
from illness_reference import ILLNESS_TABLE, SYMPTOM_LIST

random.seed(42)  # reproducibility

ROWS_PER_ILLNESS = 45
DROP_SYMPTOM_PROB = 0.30   # chance to drop one canonical symptom (partial presentation)
ADD_NOISE_SYMPTOM_PROB = 0.15  # chance to add one unrelated symptom (noise / comorbidity)


def generate_row(illness_row):
    canonical = set(illness_row["symptoms"])
    symptoms = set(canonical)

    # Partial presentation: sometimes drop one canonical symptom
    if len(symptoms) > 1 and random.random() < DROP_SYMPTOM_PROB:
        symptoms.discard(random.choice(list(symptoms)))

    # Noise: sometimes add one unrelated symptom not in canonical set
    if random.random() < ADD_NOISE_SYMPTOM_PROB:
        candidates = [s for s in SYMPTOM_LIST if s not in canonical]
        if candidates:
            symptoms.add(random.choice(candidates))

    age_lo, age_hi = illness_row["age_months_range"]
    dur_lo, dur_hi = illness_row["duration_days_range"]

    row = {s: int(s in symptoms) for s in SYMPTOM_LIST}
    row["age_months"] = random.randint(age_lo, age_hi)
    row["duration_days"] = random.randint(dur_lo, dur_hi)
    row["illness"] = illness_row["illness"]
    row["severity"] = illness_row["severity"]
    return row


def build_dataset():
    rows = []
    for illness_row in ILLNESS_TABLE:
        for _ in range(ROWS_PER_ILLNESS):
            rows.append(generate_row(illness_row))

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle
    return df


if __name__ == "__main__":
    df = build_dataset()
    df.to_csv("dog_illness_dataset.csv", index=False)
    print(f"Generated {len(df)} rows across {df['illness'].nunique()} illnesses.")
    print(df['illness'].value_counts())
    print("\nSample rows:")
    print(df.sample(5, random_state=1))
