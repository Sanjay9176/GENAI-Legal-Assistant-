# src/routes/triage_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import json
import os
from src.config import settings

router = APIRouter()

# 1. Configure Gemini ONCE at startup, not inside the request
# This prevents re-configuration crashes
if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

class TriageRequest(BaseModel):
    description: str

@router.post("/classify-case")
async def classify_case(request: TriageRequest):
    """
    Analyzes user input and returns category options.
    """
    print(f"🧠 Received Request: {request.description}")

    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Server Error: API Key missing in settings")

    # 2. Use a specific, known-working model name
    # "gemini-1.5-pro" is usually the most stable standard model
    target_model = "gemini-2.0-flash" 
    
    prompt = f"""
    You are a legal intake assistant for the Republic of India (Indian Penal Code, Civil Procedure Code).
    Analyze this user situation: "{request.description}"
    
    Task: Identify the most likely legal category and providing clarification options.
    
    You MUST return a raw JSON object (no markdown formatting) with this exact structure:
    {{
        "category_detected": "The main category (e.g. Civil, Criminal, Family)",
        "confidence_score": 0.85,
        "clarification_needed": true,
        "options": ["Option A", "Option B", "Option C"]
    }}
    
    Example Options for a neighbor dispute:
    ["Boundary/Property Dispute (Civil)", "Physical Threat/Assault (Criminal)", "Nuisance/Noise (Tort)"]
    """
    
    try:
        model = genai.GenerativeModel(target_model)
        response = model.generate_content(prompt)
        
        # Clean response
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        print("✅ AI Response Generated")
        
        return json.loads(clean_text)

    except Exception as e:
        print(f"❌ AI Error details: {e}")
        # If 1.5-pro fails, it might trigger a 404. We catch it here.
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")