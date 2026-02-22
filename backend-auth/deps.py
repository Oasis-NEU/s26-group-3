"""Shared dependencies for route protection. Other devs can use: Depends(get_current_user)."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth_service import get_current_user_from_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Require valid JWT. Use on protected routes: Depends(get_current_user)."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = get_current_user_from_token(credentials.credentials, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    """Optional auth: returns user if token valid, else None. For routes that work with or without login."""
    if not credentials:
        return None
    return get_current_user_from_token(credentials.credentials, db)
