"""
Supabase JWT verification middleware.
Every protected endpoint calls get_current_user() as a dependency.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os

bearer = HTTPBearer()

def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    return create_client(url, key)

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
