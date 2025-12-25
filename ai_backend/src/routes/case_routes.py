# src/routes/case_routes.py
from fastapi import APIRouter, HTTPException, Body
from typing import List
from pydantic import BaseModel
from bson import ObjectId
from src.database import cases_collection
from src.models.case_model import Case

router = APIRouter()

# ---------------- RESPONSE MODEL ---------------- #

class CaseResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str = ""
    facts: dict = {}
    status: str = "Draft"
    step: int = 1
    chat_history: List[dict] = []
    generated_documents: List[dict] = []

# ---------------- CREATE CASE ---------------- #

@router.post("/cases/", response_model=dict)
async def create_case(case: Case):
    case_data = case.model_dump(by_alias=True, exclude=["id"])
    result = await cases_collection.insert_one(case_data)
    return {"message": "Case created", "id": str(result.inserted_id)}

# ---------------- LIST USER CASES ---------------- #

@router.get("/cases/user/{user_id}")
async def get_user_cases(user_id: str):
    cases = []
    async for doc in cases_collection.find({"user_id": user_id}):
        cases.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", "Untitled"),
            "category": doc.get("type", "General"),
            "status": doc.get("status", "Draft"),
            "step": doc.get("step", 1),
            "date": doc.get("date", "")
        })
    return cases

# ---------------- GET SINGLE CASE ---------------- #

@router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case_details(case_id: str):
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case ID")

    doc = await cases_collection.find_one({"_id": ObjectId(case_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Case not found")

    return CaseResponse(
        id=str(doc["_id"]),
        title=doc.get("title") or doc.get("case_title") or "Untitled Case",
        category=doc.get("type", "General"),
        description=doc.get("description", ""),
        facts=doc.get("facts", {}),
        status=doc.get("status", "Draft"),
        step=doc.get("step", 1),
        chat_history=doc.get("chat_history", []),
        generated_documents=doc.get("generated_documents", [])
    )

# ---------------- SAVE CONTEXT (NEW) ---------------- #

@router.put("/cases/{case_id}/context")
async def save_case_context(case_id: str, payload: dict = Body(...)):
    """
    Updates the case description and facts (Auto-Save Context).
    Expected payload: { "description": "...", "facts": {...} }
    """
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case ID")

    # We use $set to update only specific fields without overwriting the whole document
    result = await cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {
            "$set": {
                "description": payload.get("description", ""),
                "facts": payload.get("facts", {})
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")

    return {"message": "Case context updated successfully"}