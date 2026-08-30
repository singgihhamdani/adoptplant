from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> dict:
    """
    Validate Supabase JWT Token. In development mode or if credentials not provided,
    fallback gracefully to allow flexible development.
    """
    if not credentials:
        if settings.APP_ENV == "development":
            return {"sub": "dev-user", "role": "authenticated", "email": "dev@rehabtrack.id"}
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
        )
    
    token = credentials.credentials
    if not settings.SUPABASE_JWT_SECRET:
        # Decode without verification in dev if secret not configured
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
        except Exception:
            return {"sub": "user", "role": "authenticated"}
            
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        )
