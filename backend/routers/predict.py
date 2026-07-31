"""
Breed identification router.

Uses GPT-4o-mini vision via the Vercel AI Gateway for accurate breed
detection across hundreds of breeds. The model receives the uploaded image
as a base64 data URI and returns a structured JSON list of top breed
matches with confidence scores.

The AI_GATEWAY_API_KEY environment variable must be set (it is set
automatically when the Vercel AI Gateway integration is connected).
"""
import os
import base64
import json
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from auth import get_current_user
from schemas import BreedPredictionResponse, BreedPrediction
import httpx
from dotenv import load_dotenv

# Load variables from the .env file into the environment
load_dotenv()

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB

_AI_GATEWAY_BASE = "https://ai-gateway.vercel.sh/v1"
_MODEL = "openai/gpt-4o-mini"

_SYSTEM_PROMPT = (
    "You are an expert canine breed identification system. "
    "When given a photo of a dog, identify the top 3 most likely breeds "
    "and assign a confidence score (0.0–1.0) to each. "
    "If the image clearly shows a mixed-breed dog, list the most prominent "
    "component breeds (e.g. 'Labrador Mix', 'Border Collie Mix'). "
    "If the image does not show a dog at all, return an empty list.\n\n"
    "IMPORTANT: Respond ONLY with a valid JSON array, no markdown, no explanation. "
    "Format: [{\"breed\": \"Breed Name\", \"confidence\": 0.85}, ...]"
)


async def _call_vision_api(image_bytes: bytes, content_type: str) -> list[dict]:
    """
    Sends the image to GPT-4o-mini via the AI Gateway and parses the
    structured breed predictions from the response.
    """
    api_key = os.getenv("AI_GATEWAY_API_KEY", "")
    if not api_key or "sentinel" in api_key:
        raise ValueError("AI_GATEWAY_API_KEY is not configured.")

    # Encode the image as a base64 data URI
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_uri = f"data:{content_type};base64,{b64}"

    payload = {
        "model": _MODEL,
        "max_tokens": 256,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_uri, "detail": "low"},
                    },
                    {
                        "type": "text",
                        "text": "Identify the dog breed(s) in this photo.",
                    },
                ],
            },
        ],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{_AI_GATEWAY_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()

    raw = resp.json()["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if the model returns them despite instructions
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    predictions = json.loads(raw)

    # Validate and clamp each entry
    result = []
    for item in predictions[:3]:
        breed = str(item.get("breed", "Unknown")).strip()
        confidence = max(0.0, min(1.0, float(item.get("confidence", 0.5))))
        result.append({"breed": breed, "confidence": round(confidence, 4)})

    return result


@router.post("/breed", response_model=BreedPredictionResponse)
async def predict_breed(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    # Normalise content type: some browsers send "image/jpg"
    content_type = file.content_type or ""
    if content_type == "image/jpg":
        content_type = "image/jpeg"

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, WebP.",
        )

    contents = await file.read()

    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(contents) / 1024 / 1024:.1f} MB). Maximum is 8 MB.",
        )

    try:
        predictions = await _call_vision_api(contents, content_type)
    except ValueError as e:
        # API key not configured
        raise HTTPException(status_code=503, detail=str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Vision API error: {e.response.status_code}",
        )
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not parse breed prediction response: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Breed identification failed: {str(e)}",
        )

    if not predictions:
        raise HTTPException(
            status_code=422,
            detail="No dog detected in the image. Please upload a clear photo of a dog.",
        )

    return BreedPredictionResponse(
        predictions=[
            BreedPrediction(breed=p["breed"], confidence=p["confidence"])
            for p in predictions
        ]
    )