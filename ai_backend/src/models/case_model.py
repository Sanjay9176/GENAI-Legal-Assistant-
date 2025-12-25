# src/models/case_model.py
from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Dict, Annotated
from datetime import datetime

# Helper to handle MongoDB ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

# 1. The Timeline Step (The Roadmap)
# This powers the left column of your dashboard (Step 1, Step 2...)
class TimelineStep(BaseModel):
    step_id: int
    title: str          # e.g., "Send Legal Notice"
    status: str         # "completed", "in_progress", "locked"
    description: Optional[str] = None
    due_date: Optional[str] = None

# 2. The Main Case Model
class Case(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    
    # Basic Info
    case_title: str
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # CONTEXT (Fixes Gap 1 & 2)
    # Copied from User Profile when case is created
    jurisdiction: Dict[str, str]  # e.g. {"state": "Karnataka", "district": "Bengaluru"}
    category: str                 # e.g. "Civil Property Dispute"
    
    # STRUCTURED DATA (Fixes Gap 3)
    # The Roadmap
    timeline: List[TimelineStep] = []
    
    # The Extracted Facts (e.g., {"amount": "50000"})
    structured_facts: Dict[str, str] = {} 
    
    # DOCUMENTS & CHAT
    current_draft: Optional[str] = None
    chat_history: List[dict] = []

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "case_title": "Neighbor Dispute",
                "jurisdiction": {"state": "Karnataka", "district": "Bengaluru"},
                "timeline": [{"step_id": 1, "title": "Start", "status": "active"}]
            }
        }