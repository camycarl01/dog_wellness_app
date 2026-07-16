"""
Breed prediction wrapper around the trained MobileNetV2 model.

This is the module Day 16's FastAPI endpoint imports and calls directly.
Model + class index mapping load once at import time (same pattern as
ml/illness/predict.py), not per-request.
"""

import os
import json
import io
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))

_model = tf.keras.models.load_model(os.path.join(_THIS_DIR, "breed_model.h5"))

with open(os.path.join(_THIS_DIR, "class_indices.json")) as f:
    _CLASS_INDICES = json.load(f)  # {"beagle": 0, "chihuahua": 1, ...}

# Invert so we can go from predicted index -> breed name
_INDEX_TO_BREED = {v: k for k, v in _CLASS_INDICES.items()}

IMG_SIZE = (224, 224)


def _prepare_image(image_bytes: bytes) -> np.ndarray:
    """
    Converts raw uploaded image bytes into the exact preprocessed array
    shape/format the model expects: (1, 224, 224, 3), MobileNetV2-normalized.

    Must match training preprocessing exactly (same resize, same
    preprocess_input call) or predictions will be silently wrong without
    throwing any error -- this is the single easiest place for a subtle,
    hard-to-notice bug in this whole feature.
    """
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")  # handles grayscale/RGBA uploads safely
    img = img.resize(IMG_SIZE)

    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)
    img_array = preprocess_input(img_array)  # same normalization as training

    return img_array


def predict_breed(image_bytes: bytes, top_k: int = 3) -> list[dict]:
    """
    Returns a list of {"breed": str, "confidence": float} dicts, sorted by
    confidence descending, length top_k. Breed names are the raw training
    labels (e.g. "german_shepherd") -- caller decides whether to reformat
    for display (e.g. "German Shepherd").
    """
    img_array = _prepare_image(image_bytes)
    predictions = _model.predict(img_array, verbose=0)[0]  # shape (10,)

    top_indices = predictions.argsort()[-top_k:][::-1]

    results = []
    for idx in top_indices:
        breed = _INDEX_TO_BREED[idx]
        confidence = float(predictions[idx])
        results.append({"breed": breed, "confidence": round(confidence, 4)})

    return results