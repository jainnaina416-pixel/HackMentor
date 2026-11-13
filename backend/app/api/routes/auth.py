from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/api/auth", tags=["auth"])

class GoogleAuthRequest(BaseModel):
    credential: str

class AuthUserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None

class AuthSessionResponse(BaseModel):
    token: str
    user: AuthUserResponse

@router.post("/google", response_model=AuthSessionResponse)
def verify_google_token(body: GoogleAuthRequest):
    """
    Cryptographically verify Google ID token received from Google Identity Services (GIS).
    Uses Google's official google-auth library and validates against GOOGLE_CLIENT_ID.
    """
    token = body.credential
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token (credential) is required."
        )

    client_id = settings.GOOGLE_CLIENT_ID or getattr(settings, "Google_CLIENT_ID", None)

    try:
        request = google_requests.Request()
        # Verify cryptographically against Google certificates and client ID audience
        id_info = id_token.verify_oauth2_token(
            token,
            request,
            audience=client_id if client_id else None
        )

        # Validate issuer
        issuer = id_info.get("iss")
        if issuer not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token issuer: {issuer}"
            )

        user_id = id_info.get("sub")
        email = id_info.get("email")
        name = id_info.get("name") or (email.split("@")[0] if email else "Google User")
        picture = id_info.get("picture")

        if not email or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incomplete user profile in Google ID token."
            )

        logger.info(f"Verified Google ID token for {email} (sub: {user_id})")

        return AuthSessionResponse(
            token=token,
            user=AuthUserResponse(
                id=user_id,
                email=email,
                name=name,
                picture=picture,
            )
        )
    except ValueError as val_err:
        logger.warning(f"Google ID token verification failed: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google ID token: {str(val_err)}"
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Unexpected error during Google verification: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to verify Google credential at this time."
        )

@router.post("/logout")
def logout_endpoint():
    return {"status": "ok", "message": "Logged out successfully"}
