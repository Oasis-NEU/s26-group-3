"""Auth routes: signup, login, refresh, forgot-password, reset-password."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    SignupRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
)
from auth_service import (
    validate_northeastern_email,
    validate_nuid,
    create_user,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_password_reset_token,
    consume_reset_token,
    update_user_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=LoginResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """Create user with Northeastern email and NUID."""
    if not validate_northeastern_email(data.email):
        raise HTTPException(
            status_code=400,
            detail="Email must be a valid Northeastern email (@northeastern.edu)",
        )
    if not validate_nuid(data.nuid):
        raise HTTPException(
            status_code=400,
            detail="NUID must be exactly 9 digits",
        )

    existing = db.query(User).filter(
        (User.email == data.email.strip().lower()) | (User.nuid == data.nuid.strip())
    ).first()
    if existing:
        if existing.email == data.email.strip().lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="NUID already registered")

    user = create_user(db, data.email, data.nuid, data.password)
    access = create_access_token(user.id, user.email)
    refresh = create_refresh_token(user.id)

    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        user=UserResponse(id=user.id, email=user.email, nuid=user.nuid),
    )


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password. Returns JWT tokens."""
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access = create_access_token(user.id, user.email)
    refresh = create_refresh_token(user.id)

    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        user=UserResponse(id=user.id, email=user.email, nuid=user.nuid),
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access = create_access_token(user.id, user.email)
    new_refresh = create_refresh_token(user.id)

    return LoginResponse(
        access_token=access,
        refresh_token=new_refresh,
        user=UserResponse(id=user.id, email=user.email, nuid=user.nuid),
    )


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request password reset. In production, send email with reset link.
    For demo, we return the token (frontend can show it or simulate email).
    """
    if not validate_northeastern_email(data.email):
        raise HTTPException(
            status_code=400,
            detail="Email must be a valid Northeastern email",
        )

    user = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if not user:
        # Don't reveal whether email exists (security)
        return {"message": "If that email exists, a reset link has been sent"}

    token = create_password_reset_token(db, user.id)

    # TODO: In production, send email with reset link:
    # reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    # send_email(user.email, "Reset your PawSwap password", reset_url)
    return {
        "message": "If that email exists, a reset link has been sent",
        "reset_token": token,  # For demo only; remove in production
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token from forgot-password."""
    user = consume_reset_token(db, data.token)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token",
        )

    update_user_password(db, user, data.new_password)
    return {"message": "Password has been reset successfully"}
