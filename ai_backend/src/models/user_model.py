# src/models/user_model.py
from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime

# --- Helpers ---
# Helper to handle MongoDB ObjectId (makes the ID easier to use)
PyObjectId = Annotated[str, BeforeValidator(str)]

# --- DOMAIN MODELS (Legal Context) ---

# 1. Defines what "Jurisdiction" looks like (Preserved)
class Jurisdiction(BaseModel):
    state: str          # e.g., "Karnataka"
    district: str       # e.g., "Bengaluru Urban"

# --- AUTH MODELS (New) ---

class UserRegister(BaseModel):
    """Data required to sign up (Incoming Payload)."""
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    # Optional: Users can set these during signup, or update later
    jurisdiction: Optional[Jurisdiction] = None
    preferred_language: str = "English"

class UserLogin(BaseModel):
    """Data required to log in (Incoming Payload)."""
    email: EmailStr
    password: str

class Token(BaseModel):
    """The JWT response sent back after successful login."""
    access_token: str
    token_type: str
    user_name: str

# --- DATABASE / PROFILE MODELS ---

class UserUpdate(BaseModel):
    """Data sent by Frontend to update an existing profile."""
    jurisdiction: Optional[Jurisdiction] = None
    preferred_language: Optional[str] = None
    full_name: Optional[str] = None

class User(BaseModel):
    """
    The full User object as stored in MongoDB.
    Combines Auth fields + Legal Profile fields.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    # identity
    full_name: str
    email: EmailStr
    password_hash: str  # Stored internally, never exposed in plain text
    
    # Profile / Legal Context
    jurisdiction: Optional[Jurisdiction] = None 
    preferred_language: str = "English"
    
    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "full_name": "Aditya Verma",
                "email": "user@example.com",
                "jurisdiction": {
                    "state": "Karnataka",
                    "district": "Bengaluru Urban"
                },
                "preferred_language": "Hindi"
            }
        }