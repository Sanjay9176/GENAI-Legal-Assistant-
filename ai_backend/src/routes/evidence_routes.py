# src/routes/evidence_routes.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from bson import ObjectId
from src.database import cases_collection
from src.utils.text_extractor import extract_text_from_file 
from datetime import datetime

router = APIRouter()

# --- 1. UPLOAD EVIDENCE ---
@router.post("/cases/{case_id}/evidence")
async def upload_evidence(case_id: str, file: UploadFile = File(...)):
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case ID")

    # Read file bytes
    file_content = await file.read()
    
    # Extract text using the utility
    content_text = await extract_text_from_file(file_content, file.content_type, file.filename)

    new_evidence = {
        "id": str(ObjectId()),
        "filename": file.filename,
        "content_type": file.content_type,
        "extracted_text": content_text[:8000], # Limit per file to save DB space
        "uploaded_at": datetime.utcnow().isoformat()
    }

    # Save to MongoDB
    update_result = await cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$push": {"evidence": new_evidence}}
    )

    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")

    return {"message": "Evidence uploaded", "evidence": new_evidence}

# --- 2. FETCH EVIDENCE ---
@router.get("/cases/{case_id}/evidence")
async def get_evidence(case_id: str):
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case ID")

    case = await cases_collection.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case.get("evidence", [])

# --- 3. DELETE EVIDENCE (NEW) ---
@router.delete("/cases/{case_id}/evidence/{evidence_id}")
async def delete_evidence(case_id: str, evidence_id: str):
    """
    Removes a specific file/evidence from the case's evidence list.
    """
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case ID")

    # Use $pull to remove the item with the matching 'id' from the evidence array
    result = await cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$pull": {"evidence": {"id": evidence_id}}}
    )

    if result.modified_count == 0:
        # Note: If modified_count is 0, it means either the case didn't exist
        # OR the specific evidence_id wasn't found in that case.
        raise HTTPException(status_code=404, detail="Evidence not found or Case ID incorrect")

    return {"message": "Evidence deleted successfully"}