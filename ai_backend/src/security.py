from datetime import datetime, timedelta
from typing import Optional
import jwt  # <--- WE ARE USING PyJWT ONLY
from passlib.context import CryptContext
from .config import settings

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