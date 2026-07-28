"""
Supabase JWT verification middleware.
Every protected endpoint calls get_current_user() as a dependency.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client, ClientOptions
from pathlib import Path
import os
from dotenv import load_dotenv

_project_root = Path(__file__).resolve().parent.parent

for candidate in [
    _project_root / "new frontend" / ".env",
    _project_root / "frontend" / ".env",
]:
    if candidate.exists():
        load_dotenv(candidate, override=False)

bearer = HTTPBearer()

def get_supabase(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> Client:
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY must be set in .env")
    options = ClientOptions(headers={"Authorization": f"Bearer {credentials.credentials}"})
    return create_client(url, key, options=options)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    supabase: Client = Depends(get_supabase),
):
    """
    Verify the Supabase JWT and return the user payload.
    Attach this as a dependency to any protected route:
        @router.get("/me")
        async def me(user=Depends(get_current_user)):
            return user
    """
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
