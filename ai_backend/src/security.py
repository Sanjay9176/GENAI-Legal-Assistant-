from datetime import datetime, timedelta
from typing import Optional
import jwt  # <--- WE ARE USING PyJWT ONLY
from .config import settings
import bcrypt # <--- 1. Import bcrypt directly

# --- START FIX FOR PASSLIB + BCRYPT 4.0 ---
# passlib tries to find 'bcrypt.__about__' which was removed in bcrypt 4.0.
# We manually inject it back here so passlib doesn't crash.
try:
    bcrypt.__about__
except AttributeError:
    class About:
        __version__ = bcrypt.__version__
    bcrypt.__about__ = About()
# --- END FIX ---

from passlib.context import CryptContext

# 1. Setup Password Hashing (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the typed password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Turns a plain password into a secure hash."""
    return pwd_context.hash(password)

# 2. Setup Token Creation (JWT)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generates a JWT Token string."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Use the jwt library to encode
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt