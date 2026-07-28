from fastapi import APIRouter, HTTPException
from urllib.parse import quote
import httpx
import base64

router = APIRouter()

BREEDS_LIST_URL = 'https://dog.ceo/api/breeds/list/all'
BREED_IMAGE_URL = 'https://dog.ceo/api/breed/{breed_path}/images/random'


def _title_case(value: str) -> str:
    return ' '.join(part[:1].upper() + part[1:].lower() for part in value.replace('_', ' ').replace('-', ' ').split())


def _fallback_image_data_uri(label: str) -> str:
        initials = ''.join(part[:1] for part in label.replace('/', ' ').split()[:2]).upper() or 'DOG'
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#dbeafe"/>
            <stop offset="100%" stop-color="#c7d2fe"/>
        </linearGradient>
    </defs>
    <rect width="160" height="160" rx="28" fill="url(#g)"/>
    <circle cx="80" cy="66" r="30" fill="#fff" fill-opacity="0.78"/>
    <circle cx="58" cy="50" r="10" fill="#fff" fill-opacity="0.92"/>
    <circle cx="102" cy="50" r="10" fill="#fff" fill-opacity="0.92"/>
    <circle cx="48" cy="80" r="10" fill="#fff" fill-opacity="0.92"/>
    <circle cx="112" cy="80" r="10" fill="#fff" fill-opacity="0.92"/>
    <rect x="48" y="100" width="64" height="34" rx="17" fill="#fff" fill-opacity="0.86"/>
    <text x="80" y="126" font-family="Arial, sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#1e293b">{initials}</text>
</svg>'''
        encoded = base64.b64encode(svg.encode('utf-8')).decode('ascii')
        return f'data:image/svg+xml;base64,{encoded}'


@router.get('/breeds')
async def list_breeds():
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(BREEDS_LIST_URL)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Could not load breeds: {exc}')

    message = data.get('message', {})
    breeds = []
    for breed, sub_breeds in message.items():
        if not sub_breeds:
            breeds.append({
                'path': breed,
                'label': _title_case(breed),
            })
            continue

        for sub_breed in sub_breeds:
            breeds.append({
                'path': f'{breed}/{sub_breed}',
                'label': f'{_title_case(sub_breed)} {_title_case(breed)}',
            })

    breeds.sort(key=lambda item: item['label'])
    return {'breeds': breeds}


@router.get('/breeds/image/{breed_path:path}')
async def breed_image(breed_path: str):
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(BREED_IMAGE_URL.format(breed_path=quote(breed_path, safe='/')))
            response.raise_for_status()
            data = response.json()
            image_url = data.get('message', '')
            if image_url:
                return {'image_url': image_url}
    except Exception:
        pass

    return {'image_url': _fallback_image_data_uri(_title_case(breed_path.replace('/', ' ')))}