# src/routes/user_routes.py
from fastapi import APIRouter, HTTPException, Depends, status
from src.models.user_model import UserRegister, UserLogin, Token
from src.database import users_collection 
from src.security import get_password_hash, verify_password, create_access_token
from uuid import uuid4
from datetime import datetime, timedelta
from src.utils.email_utils import send_otp_email
from pydantic import BaseModel, EmailStr
import random # <--- Added missing import

# The prefix "/auth" means all routes below start with /auth
router = APIRouter(prefix="/auth", tags=["Authentication"])

# ==================================================
# 1. FORGOT PASSWORD (OTP)
# ==================================================

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password") # ✅ Fixed: Final URL is /auth/forgot-password
async def forgot_password(request: ForgotPasswordRequest):
    email = request.email.lower()
    
    # 1. Check if user exists
    user = await users_collection.find_one({"email": email})
    if not user:
        # Security best practice: Don't reveal if email exists or not
        print(f"Debug: User not found for email {email}")
        return {"message": "If email exists, OTP sent."}

    # 2. Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # 3. Save OTP to DB with Expiry (10 mins)
    expiry = datetime.utcnow() + timedelta(minutes=10)
    
    await users_collection.update_one(
        {"email": email},
        {"$set": {"reset_otp": otp, "reset_otp_expiry": expiry}}
    )

    # 4. Send Email
    # In a real app, run this in background
    email_sent = send_otp_email(email, otp)
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"message": "OTP sent to your email"}


# ==================================================
# 2. VERIFY & RESET PASSWORD
# ==================================================

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/reset-password") # ✅ Fixed: Final URL is /auth/reset-password
async def reset_password(request: ResetPasswordRequest):
    email = request.email.lower()
    
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # 1. Verify OTP match
    stored_otp = user.get("reset_otp")
    stored_expiry = user.get("reset_otp_expiry")

    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # 2. Verify Expiry
    if datetime.utcnow() > stored_expiry:
        raise HTTPException(status_code=400, detail="OTP Expired")

    # 3. Hash New Password
    hashed_password = get_password_hash(request.new_password)

    # 4. Update Password & Clear OTP
    await users_collection.update_one(
        {"email": email},
        {
            "$set": {"hashed_password": hashed_password},
            "$unset": {"reset_otp": "", "reset_otp_expiry": ""}
        }
    )

    return {"message": "Password reset successful. You can now login."}


# ==================================================
# 3. REGISTER
# ==================================================

@router.post("/register", response_model=Token)
async def register_user(user: UserRegister):
    # A. Check if email already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # B. Hash the password
    hashed_password = get_password_hash(user.password)

    # C. Create User Document
    new_user_id = str(uuid4())
    user_doc = {
        "user_id": new_user_id,
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }

    # D. Save to MongoDB
    await users_collection.insert_one(user_doc)

    # E. Auto-Login (Generate Token immediately)
    access_token = create_access_token(data={"sub": new_user_id})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": user.full_name
    }


# ==================================================
# 4. LOGIN
# ==================================================

@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    # A. Find user by email
    user = await users_collection.find_one({"email": user_credentials.email})
    
    # B. Verify user exists AND password matches
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # C. Generate Token
    access_token = create_access_token(data={"sub": user["user_id"]})

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": user["full_name"]
    }