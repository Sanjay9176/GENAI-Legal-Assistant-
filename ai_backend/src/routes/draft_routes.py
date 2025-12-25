# src/routes/draft_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.drafting_service import drafting_service

router = APIRouter()

# Define the data shape the Frontend must send
class DraftRequest(BaseModel):
    user_input: str
    category: str
    jurisdiction: dict  # e.g. {"state": "Karnataka", "district": "Bengaluru"}

@router.post("/generate-case")
async def generate_case_content(request: DraftRequest):
    """
    Called when the user clicks "Generate Draft".
    Returns the Draft + Timeline + Facts.
    """
    # Call the service we created in Step 1
    result = await drafting_service.generate_structured_case(
        request.user_input,
        request.category,
        request.jurisdiction
    )
    
    # If the service reported an error, we tell the frontend
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result