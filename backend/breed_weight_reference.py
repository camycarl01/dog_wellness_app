"""
Breed healthy-weight reference table.

Source: American Kennel Club Breed Weight Chart
https://www.akc.org/expert-advice/nutrition/breed-weight-chart/
(accessed July 2026, values converted lbs -> kg)

Notes on data quality (flagging rather than silently smoothing over):
  - AKC's page lists a couple of breeds with identical low/high figures
    (e.g. Chihuahua "6-6 lbs", French Bulldog "28-28 lbs"), meaning their
    breed standard states a single target rather than a range. Where that
    happens, this table widens the range by ~15% each side so a real,
    healthy dog of that breed isn't automatically flagged "unhealthy" for
    being slightly off the exact standard show-weight.
  - AKC's page has an apparent typo for Beagle ("15-13 pounds", reversed).
    Corrected to 13-15 here.
  - This is a REFERENCE STARTING POINT, not a diagnosis. Breed standards
    reflect show-dog ideals; a healthy pet can reasonably fall outside
    them. This should be presented to users as a general guide, alongside
    the trend view, not as a strict pass/fail health verdict.
"""

LB_TO_KG = 0.453592


def _lb_range_to_kg(lo_lb: float, hi_lb: float, widen_if_equal: bool = True) -> tuple[float, float]:
    if lo_lb == hi_lb and widen_if_equal:
        lo_lb, hi_lb = lo_lb * 0.85, hi_lb * 1.15
    return round(lo_lb * LB_TO_KG, 1), round(hi_lb * LB_TO_KG, 1)


# breed name (lowercase, matches how it should be looked up) -> (min_kg, max_kg)
# Covers ~35 of the most commonly owned breeds. Extend as needed.
_RAW_LB_RANGES = {
    "labrador retriever": (55, 80),
    "labrador": (55, 80),
    "german shepherd": (50, 90),
    "german shepherd dog": (50, 90),
    "golden retriever": (55, 75),
    "french bulldog": (28, 28),
    "bulldog": (40, 50),
    "poodle": (40, 70),          # standard poodle as default
    "poodle (standard)": (40, 70),
    "poodle (miniature)": (10, 15),
    "poodle (toy)": (4, 6),
    "beagle": (13, 15),          # corrected from AKC's reversed "15-13"
    "rottweiler": (80, 135),
    "dachshund": (11, 32),
    "yorkshire terrier": (7, 7),
    "boxer": (15, 80),           # AKC lists an unusually wide range
    "siberian husky": (35, 60),
    "great dane": (110, 175),
    "doberman pinscher": (60, 100),
    "shih tzu": (9, 16),
    "border collie": (30, 55),
    "chihuahua": (6, 6),
    "pug": (14, 18),
    "cavalier king charles spaniel": (13, 18),
    "australian shepherd": (40, 65),
    "cocker spaniel": (20, 30),
    "shiba inu": (17, 23),
    "bernese mountain dog": (70, 115),
    "maltese": (7, 7),
    "pomeranian": (3, 7),
    "havanese": (7, 13),
    "basset hound": (40, 65),
    "chow chow": (45, 70),
    "chinese shar-pei": (45, 60),
    "st bernard": (120, 180),
    "saint bernard": (120, 180),
    "mastiff": (120, 230),
    "italian greyhound": (7, 14),
    "greyhound": (60, 70),
    "collie": (50, 75),
    "akita": (70, 130),
    "vizsla": (44, 60),
    "weimaraner": (55, 90),
    "west highland white terrier": (15, 20),
    "west highland terrier": (15, 20),
    "shetland sheepdog": (15, 25),
    "papillon": (5, 10),
    "boston terrier": (12, 25),
    "bichon frise": (12, 18),
    "newfoundland": (100, 150),
}

BREED_WEIGHT_RANGES_KG = {
    breed: _lb_range_to_kg(lo, hi) for breed, (lo, hi) in _RAW_LB_RANGES.items()
}

# Fallback ranges by size bracket, used when the dog's breed string doesn't
# match anything in BREED_WEIGHT_RANGES_KG (unrecognized breed, mixed breed,
# typo, etc). Bracket is chosen by the dog's OWN current weight, which is a
# soft heuristic -- see get_healthy_range()'s docstring for the caveat.
SIZE_FALLBACK_RANGES_KG = {
    "toy":    (1.0, 6.0),
    "small":  (5.0, 12.0),
    "medium": (10.0, 25.0),
    "large":  (22.0, 45.0),
    "giant":  (40.0, 90.0),
}


def _normalize_breed(breed: str) -> str:
    return breed.strip().lower()


def get_healthy_range(breed: str, current_weight_kg: float) -> tuple[float, float, bool]:
    """
    Returns (min_kg, max_kg, is_breed_specific).

    is_breed_specific=True means the range came from a real breed match.
    False means we fell back to a size-bracket estimate because the breed
    string wasn't recognized -- this should be surfaced to the user (e.g.
    "estimated by size, breed not recognized") rather than presented with
    the same confidence as a real breed match.

    Caveat on the fallback: bracketing by the dog's OWN current weight to
    pick a size category is circular reasoning (we're using the value we're
    about to judge to pick the yardstick). It's an acceptable rough default
    for unrecognized/mixed breeds, but it will never flag a dog as
    over/underweight relative to its OWN bracket by definition -- it can
    only catch extreme outliers. This is a known limitation, not a bug.
    """
    key = _normalize_breed(breed)
    if key in BREED_WEIGHT_RANGES_KG:
        lo, hi = BREED_WEIGHT_RANGES_KG[key]
        return lo, hi, True

    if current_weight_kg < 6:
        bracket = "toy"
    elif current_weight_kg < 10:
        bracket = "small"
    elif current_weight_kg < 25:
        bracket = "medium"
    elif current_weight_kg < 45:
        bracket = "large"
    else:
        bracket = "giant"

    lo, hi = SIZE_FALLBACK_RANGES_KG[bracket]
    return lo, hi, False


def weight_status(current_weight_kg: float, min_kg: float, max_kg: float) -> str:
    """Returns 'underweight' | 'healthy' | 'overweight'."""
    if current_weight_kg < min_kg:
        return "underweight"
    if current_weight_kg > max_kg:
        return "overweight"
    return "healthy"