"""
Trains Random Forest classifiers on the synthetic dog illness dataset.

Trains two models:
  1. illness_model.pkl   -> predicts illness name
  2. severity_model.pkl  -> predicts severity directly from symptoms
     (kept separate from illness prediction so severity isn't just a
     lookup table off the predicted illness -- lets the model react to
     symptom intensity/duration directly)

Usage:
    python train_model.py
"""

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from illness_reference import SYMPTOM_LIST

FEATURE_COLS = SYMPTOM_LIST + ["age_months", "duration_days"]


def load_data(path="dog_illness_dataset.csv"):
    return pd.read_csv(path)


def train_illness_model(df):
    X = df[FEATURE_COLS]
    y = df["illness"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"\n=== Illness model ===")
    print(f"Accuracy: {acc:.3f}")
    print(classification_report(y_test, preds))
    return model, acc


def train_severity_model(df):
    X = df[FEATURE_COLS]
    y = df["severity"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"\n=== Severity model ===")
    print(f"Accuracy: {acc:.3f}")
    print(classification_report(y_test, preds))
    return model, acc


if __name__ == "__main__":
    df = load_data()

    illness_model, illness_acc = train_illness_model(df)
    severity_model, severity_acc = train_severity_model(df)

    joblib.dump(illness_model, "illness_model.pkl")
    joblib.dump(severity_model, "severity_model.pkl")
    joblib.dump(FEATURE_COLS, "feature_columns.pkl")

    print(f"\nSaved illness_model.pkl (acc={illness_acc:.3f})")
    print(f"Saved severity_model.pkl (acc={severity_acc:.3f})")
    print("Saved feature_columns.pkl (defines the exact input column order the API must send)")

    if illness_acc < 0.75 or severity_acc < 0.75:
        print("\n⚠️  One or both models are below the 75% accuracy target. "
              "Consider: more rows per illness, less noise, or fewer overlapping symptom sets.")
