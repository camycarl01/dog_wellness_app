"""
Sanity check: feed the trained model symptom combinations that are NOT exact
matches to any canonical illness case, to check it's generalizing rather than
memorizing.
"""

from predict import predict

test_cases = [
    # Partial parvovirus-like presentation, missing "loss_of_appetite" and "fever"
    (["vomiting", "diarrhea", "lethargy"], 4, 2),
    # Ambiguous: lethargy + limping alone (overlaps hip_dysplasia / tick_borne / osteoarthritis)
    (["lethargy", "limping"], 84, 10),
    # Mixed allergy + ear infection symptoms (unusual combo, not canonical to either)
    (["scratching", "ear_discharge", "skin_redness"], 30, 20),
    # Single vague symptom
    (["lethargy"], 6, 3),
    # Emergency-leaning combo not exactly matching bloat or heatstroke
    (["swelling", "vomiting", "fever"], 48, 1),
]

print("Sanity check: non-exact symptom combinations (via predict.py wrapper)\n")
for symptoms_list, age, duration in test_cases:
    symptoms = {s: True for s in symptoms_list}
    result = predict(symptoms, age, duration)
    print(f"Symptoms: {symptoms_list}, age={age}mo, duration={duration}d")
    print(f"  -> {result}\n")
