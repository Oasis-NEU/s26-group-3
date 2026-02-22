"""Auth logic: JWT, bcrypt, NUID/email validation."""

import re
import uuid
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from models import User, PasswordResetToken

# Northeastern email domain
NEU_EMAIL_SUFFIX = "@northeastern.edu"
NEU_EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@northeastern\.edu$")

# NUID: 9 digits
NUID_PATTERN = re.compile(r"^\d{9}$")

# JWT config (override via env)
import os
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "60"))


def validate_northeastern_email(email: str) -> bool:
    """Ensure email ends with @northeastern.edu."""
    return bool(NEU_EMAIL_PATTERN.match(email.strip().lower()))


def validate_nuid(nuid: str) -> bool:
    """Ensure NUID is exactly 9 digits."""
    return bool(NUID_PATTERN.match(nuid.strip()))


def hash_password(password: str) -> str:
    """Hash password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token."""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate JWT. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user_from_token(token: str, db: Session) -> Optional[User]:
    """Validate access token and return User or None."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, email: str, nuid: str, password: str) -> User:
    """Create a new user. Caller must validate email/nuid first."""
    user = User(
        email=email.strip().lower(),
        nuid=nuid.strip(),
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate by email and password. Returns User or None."""
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def create_password_reset_token(db: Session, user_id: str) -> str:
    """Create a password reset token. Returns the token string."""
    token_str = str(uuid.uuid4()) + str(uuid.uuid4()).replace("-", "")
    expires = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    prt = PasswordResetToken(
        user_id=user_id,
        token=token_str,
        expires_at=expires,
    )
    db.add(prt)
    db.commit()
    return token_str


def consume_reset_token(db: Session, token: str) -> Optional[User]:
    """
    Validate reset token and return User if valid.
    Marks token as used. Returns None if invalid/expired.
    """
    prt = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.utcnow(),
    ).first()
    if not prt:
        return None
    prt.used_at = datetime.utcnow()
    db.commit()
    user = db.query(User).filter(User.id == prt.user_id).first()
    return user


def update_user_password(db: Session, user: User, new_password: str) -> None:
    """Update user's password."""
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
