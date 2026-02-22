"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field


# --- Auth ---

class SignupRequest(BaseModel):
    email: str = Field(..., description="Northeastern email")
    nuid: str = Field(..., min_length=9, max_length=9, description="9-digit NUID")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")


class LoginRequest(BaseModel):
    email: str = Field(..., description="Northeastern email")
    password: str = Field(..., description="Password")


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Northeastern email to reset")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password (min 8 chars)")


# --- User ---

class UserResponse(BaseModel):
    id: str
    email: str
    nuid: str

    class Config:
        from_attributes = True


# Fix forward ref for LoginResponse
LoginResponse.model_rebuild()
