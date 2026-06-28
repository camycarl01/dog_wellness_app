"""
ML prediction router.
Day 15-16: Breed ID with MobileNetV2 CNN
Day 17: Feeding recommendation with XGBoost

For now, these return placeholder responses so the routes exist
and frontend can be wired up. Swap in real models later.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from auth import get_current_user
from schemas import BreedPredictionResponse, BreedPrediction
import os

router = APIRouter()

# Try to load the breed model if it exists (added on Day 15)
_breed_model = None
_breed_labels = []

def _try_load_breed_model():
    global _breed_model, _breed_labels
    try:
        import tensorflow as tf
        import json
        model_path = os.path.join(os.path.dirname(__file__), "../ml_models/breed_model.h5")
        labels_path = os.path.join(os.path.dirname(__file__), "../ml_models/breed_labels.json")
        if os.path.exists(model_path):
            _breed_model = tf.keras.models.load_model(model_path)
            with open(labels_path) as f:
                _breed_labels = json.load(f)
            print("✅ Breed model loaded")
    except Exception as e:
        print(f"⚠️  Breed model not loaded: {e}")

_try_load_breed_model()


@router.post("/breed", response_model=BreedPredictionResponse)
async def predict_breed(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if _breed_model is None:
        # Placeholder until Day 15
        return BreedPredictionResponse(
            predictions=[
                BreedPrediction(breed="Labrador Retriever", confidence=0.72),
                BreedPrediction(breed="Golden Retriever", confidence=0.18),
                BreedPrediction(breed="Flat-Coated Retriever", confidence=0.10),
            ]
        )

    # Real prediction path (active after Day 15)
    try:
        import numpy as np
        from PIL import Image
        import io
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB").resize((224, 224))
        arr = np.array(img) / 255.0
        arr = np.expand_dims(arr, axis=0)
        preds = _breed_model.predict(arr)[0]
        top3_idx = preds.argsort()[-3:][::-1]
        return BreedPredictionResponse(
            predictions=[
                BreedPrediction(breed=_breed_labels[i], confidence=float(preds[i]))
                for i in top3_idx
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
