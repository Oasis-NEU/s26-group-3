"""User routes: GET /users/me (current user profile)."""

from fastapi import APIRouter, Depends

from models import User
from schemas import UserResponse
from deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile (requires auth)."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        nuid=current_user.nuid,
    )
