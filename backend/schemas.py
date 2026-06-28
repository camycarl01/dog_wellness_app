"""
Pydantic schemas for request/response validation.
One file for now — split into per-feature files as the app grows.
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID
from enum import Enum


# ----- Enums -----

class Sex(str, Enum):
    male = "male"
    female = "female"

class Severity(str, Enum):
    mild = "mild"
    moderate = "moderate"
    severe = "severe"
    emergency = "emergency"

class VaccineStatus(str, Enum):
    up_to_date = "up_to_date"
    due_soon = "due_soon"
    overdue = "overdue"

class MealTime(str, Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"

class MoodLabel(str, Enum):
    anxious = "anxious"
    calm = "calm"
    playful = "playful"
    lethargic = "lethargic"
    aggressive = "aggressive"


# ----- Dog -----

class DogCreate(BaseModel):
    name: str
    breed: str
    dob: date
    weight_kg: float
    sex: Sex
    is_neutered: bool = False
    photo_url: Optional[str] = None

class DogUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    dob: Optional[date] = None
    weight_kg: Optional[float] = None
    sex: Optional[Sex] = None
    is_neutered: Optional[bool] = None
    photo_url: Optional[str] = None

class DogResponse(DogCreate):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ----- Symptom / illness -----

class SymptomLogCreate(BaseModel):
    dog_id: UUID
    symptoms: Dict[str, bool]   # {"lethargy": True, "vomiting": False, ...}
    duration_days: int = 1

class SymptomLogResponse(SymptomLogCreate):
    id: UUID
    logged_at: datetime
    prediction: Optional[str] = None
    severity: Optional[Severity] = None
    confidence: Optional[float] = None

class IllnessPrediction(BaseModel):
    illness: str
    confidence: float           # 0.0 – 1.0
    severity: Severity
    recommendation: str


# ----- Vet visits -----

class VetVisitCreate(BaseModel):
    dog_id: UUID
    visit_date: date
    reason: str
    notes: Optional[str] = None
    next_due_date: Optional[date] = None
    vet_name: Optional[str] = None

class VetVisitResponse(VetVisitCreate):
    id: UUID

    class Config:
        from_attributes = True


# ----- Vaccines -----

class VaccineCreate(BaseModel):
    dog_id: UUID
    vaccine_name: str
    given_date: date
    next_due_date: date

class VaccineResponse(VaccineCreate):
    id: UUID
    status: VaccineStatus

    class Config:
        from_attributes = True


# ----- Nutrition -----

class FeedingLogCreate(BaseModel):
    dog_id: UUID
    meal_time: MealTime
    food_type: str
    quantity_grams: float
    notes: Optional[str] = None

class FeedingRecommendation(BaseModel):
    kcal_per_day: float
    grams_per_day: float
    meals_per_day: int
    grams_per_meal: float
    notes: str


# ----- Weight -----

class WeightLogCreate(BaseModel):
    dog_id: UUID
    weight_kg: float
    logged_at: Optional[datetime] = None

class WeightLogResponse(WeightLogCreate):
    id: UUID
    logged_at: datetime

    class Config:
        from_attributes = True


# ----- Mood -----

class MoodLogCreate(BaseModel):
    dog_id: UUID
    mood_score: int             # 1–5
    mood_label: MoodLabel
    notes: Optional[str] = None

    @field_validator("mood_score")
    @classmethod
    def score_in_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("mood_score must be between 1 and 5")
        return v


# ----- Heat cycle -----

class HeatCycleCreate(BaseModel):
    dog_id: UUID
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None

class CyclePrediction(BaseModel):
    predicted_start: date
    breeding_window_start: date
    breeding_window_end: date
    average_cycle_days: int


# ----- Breed ID -----

class BreedPrediction(BaseModel):
    breed: str
    confidence: float           # 0.0 – 1.0

class BreedPredictionResponse(BaseModel):
    predictions: List[BreedPrediction]  # Top 3


# ----- Litter / Puppies -----

class LitterCreate(BaseModel):
    mother_dog_id: UUID
    sire_name: Optional[str] = None
    birth_date: date
    puppy_count: int
    notes: Optional[str] = None

class PuppyCreate(BaseModel):
    litter_id: UUID
    name: str
    sex: Sex
    weight_kg: Optional[float] = None
    colour: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_contact: Optional[str] = None
    is_sold: bool = False
    notes: Optional[str] = None
