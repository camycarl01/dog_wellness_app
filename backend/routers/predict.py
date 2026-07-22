"""
ML prediction router.
Day 15-16: Breed ID with MobileNetV2 CNN
Day 17: Feeding recommendation with XGBoost

Falls back to a placeholder response if the trained model files aren't
present yet, so the route exists and the frontend can be wired up
independently of ML training being finished.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from auth import get_current_user
from schemas import BreedPredictionResponse, BreedPrediction
import os

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024  # 8MB
IMG_SIZE = (224, 224)

# Try to load the breed model if it exists (added on Day 15).
# Files live in backend/ml/breed/ -- breed_model.h5 (Keras model) and
# class_indices.json (dict of {breed_name: class_index}, saved directly
# from the training notebook's train_generator.class_indices).
_breed_model = None
_index_to_breed = {}
_preprocess_input = None  # loaded alongside tensorflow, kept as a module ref


def _try_load_breed_model():
    global _breed_model, _index_to_breed, _preprocess_input
    try:
        import tensorflow as tf
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        import json

        this_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(this_dir, "..", "ml", "breed", "breed_model.h5")
        indices_path = os.path.join(this_dir, "..", "ml", "breed", "class_indices.json")

        if os.path.exists(model_path) and os.path.exists(indices_path):
            _breed_model = tf.keras.models.load_model(model_path)
            with open(indices_path) as f:
                class_indices = json.load(f)  # {"beagle": 0, "chihuahua": 1, ...}
            _index_to_breed = {v: k for k, v in class_indices.items()}
            _preprocess_input = preprocess_input
            print("✅ Breed model loaded")
        else:
            print(f"⚠️  Breed model files not found at {model_path} -- using placeholder responses")
    except Exception as e:
        print(f"⚠️  Breed model not loaded: {e}")


_try_load_breed_model()


def _prepare_image(image_bytes: bytes):
    """
    Preprocesses uploaded image bytes to exactly match training
    preprocessing: resize to 224x224, then MobileNetV2's preprocess_input
    (which scales to [-1, 1] using channel-wise mean subtraction -- NOT a
    plain /255.0 normalization, which would silently produce wrong
    predictions since it doesn't match what the model was trained on).
    """
    import numpy as np
    from PIL import Image
    import io

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32)
    arr = np.expand_dims(arr, axis=0)
    arr = _preprocess_input(arr)
    return arr


@router.post("/breed", response_model=BreedPredictionResponse)
async def predict_breed(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Allowed: {sorted(ALLOWED_CONTENT_TYPES)}",
        )

    contents = await file.read()

    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(contents) / 1024 / 1024:.1f}MB). "
                   f"Max size is {MAX_UPLOAD_SIZE_BYTES / 1024 / 1024:.0f}MB.",
        )

    if _breed_model is None:
        # Placeholder until the model files are in place
        return BreedPredictionResponse(
            predictions=[
                BreedPrediction(breed="Labrador Retriever", confidence=0.72),
                BreedPrediction(breed="Golden Retriever", confidence=0.18),
                BreedPrediction(breed="Flat-Coated Retriever", confidence=0.10),
            ]
        )

    # Real prediction path
    try:
        arr = _prepare_image(contents)
        preds = _breed_model.predict(arr, verbose=0)[0]
        top3_idx = preds.argsort()[-3:][::-1]
        return BreedPredictionResponse(
            predictions=[
                BreedPrediction(
                    breed=_index_to_breed[i].replace("_", " ").title(),
                    confidence=round(float(preds[i]), 4),
                )
                for i in top3_idx
            ]
        )
    except HTTPException:
        raise
    except Exception as e:
        # Covers corrupt/unreadable image data that passed the content-type
        # check but fails to actually decode (renamed file, truncated upload).
        raise HTTPException(status_code=400, detail=f"Could not process this image: {str(e)}")