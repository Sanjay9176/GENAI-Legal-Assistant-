import json
import shutil
import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from src.routes import user_routes, triage_routes, draft_routes, case_routes
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from uuid import uuid4
from datetime import datetime
import logging
from bson import ObjectId

from .config import settings
from .query_engine import QueryEngine
from .database import cases_collection

from src.routes import evidence_routes

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Create FastAPI App Instance ---
app = FastAPI(
    title="Gen-Vidhik Sahayak API",
    description="API for the AI-powered legal assistant.",
    version="0.1.0",
)

# ==================================================
# 1. CORS CONFIGURATION (FIXED)
# ==================================================
# Combine hardcoded origins with settings origins to be safe
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",      # Vite Local
    "http://127.0.0.1:5173",      # Vite Network
]

# Add origins from settings if they exist, avoiding duplicates
if hasattr(settings, "CLIENT_ORIGINS"):
    for origin in settings.CLIENT_ORIGINS:
        if str(origin) not in origins:
            origins.append(str(origin))

logger.info(f"🚀 Configured CORS for origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- Include User Routes ---
app.include_router(user_routes.router)
app.include_router(triage_routes.router)
app.include_router(draft_routes.router)
app.include_router(case_routes.router)
app.include_router(evidence_routes.router)

SUPPORTED_TEMPLATES = {
    "vakalatnama": "Vakalatnama",
    "affidavit": "Affidavit",
    "bail_application": "Bail Application",
    "plaint": "Plaint",
    "written_statement": "Written Statement",
    "rfe": "Request for Evidence",
    "contract": "Legal Contract"
}

# --- Initialize Query Engine ---
try:
    query_engine = QueryEngine()
    logger.info("✅ Query Engine initialized successfully.")
except Exception as e:
    logger.error(f"❌ Failed to initialize Query Engine: {e}", exc_info=True)
    query_engine = None



# ==================================================
# 1. DATA MODELS
# ==================================================

class ChatMessage(BaseModel):
    """Model for a single chat message."""
    role: str = Field(..., example="user", enum=["user", "model"])
    content: str = Field(..., example="What is a legal notice?")


class Query(BaseModel):
    """Request model for the /ask endpoint"""
    question: str = Field(..., example="What are the rights of an arrested person in India?")
    chat_history: Optional[List[ChatMessage]] = None


class Answer(BaseModel):
    """Response model for the /ask endpoint"""
    received_question: str
    answer: str
    sources: Optional[List[str]] = None
    chat_history: Optional[List[ChatMessage]] = None

class ChatRequest(BaseModel):
    query: str
    case_context: Optional[str] = None  # The current analysis/summary of the case
    history: Optional[List[dict]] = []  # Chat history (optional)

class CaseCreate(BaseModel):
    title: str
    type: str = "General"

class CaseUpdateStep(BaseModel):
    step: int
    status: Optional[str] = None


class DraftingRequest(BaseModel):
    """Request model for the /draft-document endpoint"""
    scenario: str = Field(
        ...,
        example="My friend Ravi Sharma owes me 50,000 rupees for a personal loan given on Jan 1st. He has not repaid.",
    )
    template_type: Optional[str] = "auto"

class AnalysisResponse(BaseModel):
    """Response model for the /analyze endpoint"""
    facts: Dict[str, str]
    laws: List[str]
    strategy: str
    initial_advice: str


class DraftingResponse(BaseModel):
    """Response model for the /draft-document endpoint"""
    drafted_document: str
    template_used: str
    case_id: Optional[str] = None


class DocumentAnalysisResponse(BaseModel):
    """Response model for the /analyze-document endpoint"""
    filename: str
    question: str
    extracted_text: str
    answer: str

# ==================================================
# 2. EVENTS
# ==================================================

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 API startup complete. Ready to receive requests.")
    logger.info(f"Allowing client origins: {settings.CLIENT_ORIGINS}")

# ==================================================
# 3. BASIC ENDPOINTS
# ==================================================

@app.get("/", tags=["System"])
async def read_root():
    return {"message": "Welcome to the Gen-Vidhik Sahayak API!"}


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok"}


@app.get("/templates", tags=["2. Document Drafting"])
async def get_available_templates() -> List[str]:
    """
    Returns a list of all available document template keys
    that can be used with the /draft-document endpoint.
    """
    if query_engine is None:
        logger.error("Query Engine unavailable.")
        raise HTTPException(status_code=503, detail="AI Engine is currently unavailable.")
    return list(query_engine.template_map.keys())



# ==================================================
# 4. ASK ENDPOINT (CHAT + PERSISTENCE)
# ==================================================

@app.post("/ask", response_model=Answer, tags=["1. RAG Query"])
async def ask_question(query: Query, case_id: Optional[str] = None) -> Answer:
    logger.info(f"🧠 Received query: {query.question} (case_id={case_id})")

    if query_engine is None:
        raise HTTPException(status_code=503, detail="AI Engine unavailable")

    try:
        # 1. LOAD CHAT HISTORY
        history = []
        if query.chat_history:
            history = [msg.model_dump() for msg in query.chat_history]
        elif case_id and ObjectId.is_valid(case_id):
            case_doc = await cases_collection.find_one({"_id": ObjectId(case_id)})
            if case_doc:
                history = case_doc.get("chat_history", [])

        # 2. LOAD & FORMAT CONTEXT
        # ---------------- LOAD CASE CONTEXT ---------------- #
        final_prompt = query.question
        
        if case_id and ObjectId.is_valid(case_id):
            case_doc = await cases_collection.find_one({"_id": ObjectId(case_id)})
            if case_doc:
                situation = case_doc.get("description", "")
                facts = case_doc.get("facts", {})
                
                # --- FETCH & FORMAT EVIDENCE ---
                evidence_list = case_doc.get("evidence", [])
                recent_evidence = evidence_list[-3:] # Use last 3 files to save token space
                
                evidence_text = ""
                for doc in recent_evidence:
                    clean_text = doc.get('extracted_text', '').replace('\n', ' ')
                    evidence_text += f"\n--- EVIDENCE FILE: {doc.get('filename')} ---\n{clean_text[:2000]}\n"

                # --- INJECT INTO PROMPT ---
                context_block = f"""
                [CLIENT CASE FACTS]
                Situation: {situation}
                Key Entities: {facts}

                [UPLOADED EVIDENCE (Most Recent)]
                {evidence_text}
                
                [INSTRUCTIONS]
                1. The "CLIENT CASE FACTS" and "UPLOADED EVIDENCE" are the authoritative source of truth.
                2. If the Evidence contradicts the Situation description, trust the Evidence.
                3. Do NOT search the database for specific client names (e.g. Priy, San).
                4. Search your legal database for LAWS and PRECEDENTS that apply to this scenario.
                """
                
                final_prompt = f"{context_block}\n\nUSER QUESTION: {query.question}"
                logger.info(f"✅ Context injected for case: {case_id}")

        # 3. QUERY AI
        ai_response = await run_in_threadpool(
            query_engine.query,
            user_question=final_prompt, 
            chat_history=history
        )

        # 4. SAVE HISTORY (Ensure IDs are valid)
        user_msg = {"role": "user", "content": query.question}
        model_msg = {"role": "model", "content": ai_response["answer"]}

        if case_id and ObjectId.is_valid(case_id):
            # Verify the update actually happens
            result = await cases_collection.update_one(
                {"_id": ObjectId(case_id)},
                {"$push": {"chat_history": {"$each": [user_msg, model_msg]}}}
            )
            logger.info(f"💾 Chat saved. Modified count: {result.modified_count}")

        return Answer(
            received_question=query.question,
            answer=ai_response["answer"],
            sources=ai_response.get("sources"),
            chat_history=history + [user_msg, model_msg]
        )

    except Exception as e:
        logger.error(f"💥 Ask endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ==================================================
# 5. DRAFT DOCUMENT ENDPOINT
# ==================================================

@app.post(
    "/draft-document",
    summary="Draft a legal document from a scenario",
    description="Receives a scenario and template type then generates a legal document.",
    tags=["2. Document Drafting"],
    response_model=DraftingResponse,
)
async def draft_document_endpoint(
    request: DraftingRequest,
    case_id: Optional[str] = None,
) -> DraftingResponse:
    """
    Draft a legal document based on the given scenario and template,
    and persist it into MongoDB under cases.generated_documents.
    """

    logger.info(f"📄 Received drafting request for template: {request.template_type}")

    if query_engine is None:
        logger.error("Query Engine unavailable.")
        raise HTTPException(status_code=503, detail="AI Engine is currently unavailable.")

    try:
        drafted_raw = await query_engine.draft_document(
            scenario=request.scenario,
            template_type=request.template_type,
        )

        logger.info(f"🧾 draft_document returned type={type(drafted_raw)} value={drafted_raw}")

        if drafted_raw is None:
            logger.error("draft_document returned None")
            raise HTTPException(
                status_code=500,
                detail="AI engine did not return any draft.",
            )

        drafted_text = drafted_raw if isinstance(drafted_raw, str) else str(drafted_raw)

        if drafted_text.startswith("Error:"):
            logger.warning(f"Drafting failed: {drafted_text}")
            raise HTTPException(status_code=400, detail=drafted_text)

        logger.info(f"✅ Successfully drafted document (Template: {request.template_type})")

        generated_doc = {
            "title": request.template_type or "auto_drafted_document",
            "content": drafted_text,
            "scenario": request.scenario,
            "created_at": datetime.utcnow(),
        }

        if case_id:
            result = await cases_collection.update_one(
                {"case_id": case_id},
                {"$push": {"generated_documents": generated_doc}},
            )
            if result.matched_count == 0:
                logger.warning(f"No case found for case_id={case_id}")
                raise HTTPException(status_code=404, detail="Case not found")
        else:
            case_id = str(uuid4())
            case_doc = {
                "case_id": case_id,
                "case_title": "Draft-only Case",
                "status": "active",
                "chat_history": [],
                "generated_documents": [generated_doc],
            }
            await cases_collection.insert_one(case_doc)
            logger.info(f"🆕 Created new case for draft: {case_id}")

        return DraftingResponse(
            drafted_document=drafted_text,
            template_used=request.template_type or "auto",
            case_id=case_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error during document drafting: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while drafting the document.",
        )

# ==================================================
# 6. DOCUMENT ANALYSIS ENDPOINT
# ==================================================

@app.post(
    "/analyze-document",
    summary="Upload & analyze a document (OCR + Q&A)",
    description="Upload an image or PDF, extract text using OCR, and answer a question based only on that text.",
    tags=["3. Document Analysis (OCR)"],
    response_model=DocumentAnalysisResponse,
)
async def analyze_document_endpoint(
    file: UploadFile = File(...),
    question: str = Form(...),
):
    """
    Receives an uploaded document (image/pdf) and a question.
    1. Extracts text from the document using OCR.
    2. Answers the question based only on the extracted text.
    """
    logger.info(f"📄 Received file: {file.filename}, for question: {question}")

    if query_engine is None:
        logger.error("Query Engine unavailable.")
        raise HTTPException(status_code=503, detail="AI Engine is currently unavailable.")

    try:
        file_content = await file.read()
    except Exception as e:
        logger.error(f"Error reading uploaded file: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Could not read the uploaded file.")

    try:
        extracted_text = await query_engine.get_text_from_image(file_content)

        if extracted_text.startswith("Error:"):
            logger.warning(f"OCR failed: {extracted_text}")
            raise HTTPException(status_code=400, detail=extracted_text)

        answer = await query_engine.answer_from_document(
            document_text=extracted_text,
            question=question,
        )

        if answer.startswith("Error:"):
            logger.warning(f"Document Q&A failed: {answer}")
            raise HTTPException(status_code=500, detail=answer)

        logger.info(f"✅ Successfully analyzed document: {file.filename}")

        return DocumentAnalysisResponse(
            filename=file.filename,
            question=question,
            extracted_text=extracted_text,
            answer=answer,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error during document analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal error while analyzing document.",
        )
# ... inside src/main.py ...

# ==================================================
# 7. CASE ANALYSIS (TRIAGE) ENDPOINT
# ==================================================

@app.post(
    "/analyze",
    summary="Analyze a new case (Text + OCR)",
    description="Accepts a situation description and optional file, extracts facts, and suggests a strategy.",
    tags=["1. Triage"],
)
async def analyze_case_endpoint(
    situation: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """
    1. Processing OCR (if file exists).
    2. Combining Text + OCR.
    3. Asking AI for JSON analysis.
    """
    logger.info(f"🕵️ Analyzing case. Situation length: {len(situation)}")
    
    if query_engine is None:
        raise HTTPException(status_code=503, detail="AI Engine is unavailable.")

    # 1. Handle File Upload (OCR) if present
    extracted_text = ""
    if file:
        try:
            logger.info(f"📷 Processing file: {file.filename}")
            file_content = await file.read()
            # Call the existing OCR method in your query_engine
            extracted_text = await query_engine.get_text_from_image(file_content)
            logger.info("✅ OCR Complete")
        except Exception as e:
            logger.error(f"OCR Failed: {e}")
            # We continue even if OCR fails
    
    # 2. Combine Context
    full_context = situation
    if extracted_text and not extracted_text.startswith("Error"):
        full_context += f"\n\n[Attached Document Content]:\n{extracted_text}"

    # 3. Call the NEW method we added to QueryEngine
    try:
        json_string = await query_engine.analyze_legal_situation(full_context)
        
        # 4. Parse string to JSON object
        data = json.loads(json_string)
        
        return JSONResponse(content=data)

    except json.JSONDecodeError:
        logger.error("Failed to parse AI response as JSON.")
        return JSONResponse(content={
            "facts": {"error": "AI response format error"},
            "laws": [],
            "strategy": "Analysis failed. Please try again.",
            "initial_advice": "The AI could not format the response correctly."
        })
    except Exception as e:
        logger.error(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Save to temp folder
        os.makedirs("temp_uploads", exist_ok=True)
        file_path = f"temp_uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Optional: Trigger your query_engine to ingest this file
        # await query_engine.ingest_file(file_path)
        
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# ==================================================
# 8. CASE MANAGEMENT (DASHBOARD) ENDPOINTS
# ==================================================

# Helper to format MongoDB documents for Frontend
def case_helper(case) -> dict:
    return {
        "id": str(case["_id"]),
        "title": case.get("title", "Untitled"),
        "type": case.get("type", "General"),
        "status": case.get("status", "Draft"),
        "step": case.get("step", 1),
        "date": case.get("date", ""),
        "user_email": case.get("user_email", "")
    }

@app.get("/cases")
async def get_cases(email: str):
    """Fetch all cases for a specific user."""
    cases = []
    # Using the 'cases_collection' imported from .database
    async for case in cases_collection.find({"user_email": email}):
        cases.append(case_helper(case))
    # Reverse to show newest first (optional, or handle in frontend)
    return cases[::-1] 

@app.post("/cases", status_code=201)
async def create_case(case_data: CaseCreate, email: str):
    """Create a new case in the database."""
    new_case = {
        "title": case_data.title,
        "type": case_data.type,
        "status": "Draft",
        "step": 1, # Always start at Step 1
        "date": datetime.now().strftime("%Y-%m-%d"),
        "user_email": email,
        "created_at": datetime.utcnow()
    }
    result = await cases_collection.insert_one(new_case)
    created_case = await cases_collection.find_one({"_id": result.inserted_id})
    return case_helper(created_case)

@app.delete("/cases/{case_id}")
async def delete_case(case_id: str):
    """Delete a case by ID."""
    try:
        result = await cases_collection.delete_one({"_id": ObjectId(case_id)})
        if result.deleted_count == 1:
            return {"message": "Case deleted"}
        raise HTTPException(status_code=404, detail="Case not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Case ID format")

@app.put("/cases/{case_id}/progress")
async def update_case_progress(case_id: str, update_data: CaseUpdateStep):
    """Update the current step/status (Save Progress)."""
    data = {"step": update_data.step}
    if update_data.status:
        data["status"] = update_data.status
        
    await cases_collection.update_one(
        {"_id": ObjectId(case_id)}, 
        {"$set": data}
    )
    return {"message": "Progress saved"}
# ==================================================
# 9. UNIVERSAL CHAT ENDPOINT (Robust Adapter Version)
# ==================================================

# ... inside src/main.py ...

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Handles user chat. Detects if the user wants to draft a document 
    and returns the document structure for the frontend.
    """
    if query_engine is None:
        raise HTTPException(status_code=503, detail="AI Engine is unavailable.")

    try:
        query_lower = request.query.lower()
        
        # --- A. INTENT DETECTION ---
        draft_keywords = ["draft", "generate", "create", "make a", "prepare"]
        is_drafting_request = any(k in query_lower for k in draft_keywords)

        # --- B. DRAFTING LOGIC ---
        if is_drafting_request:
            logger.info(f"⚡ Drafting Intent Detected: {request.query}")
            
            # 1. Automatic Type Detection
            detected_type = "auto" 
            for key in SUPPORTED_TEMPLATES.keys():
                if key in query_lower or key.replace("_", " ") in query_lower:
                    detected_type = key
                    break
            
            if "bail" in query_lower and detected_type == "auto":
                detected_type = "bail_application"

            # 2. Generate the text (Using Real Engine)
            try:
                drafted_text = await query_engine.draft_document(
                    scenario=request.case_context or "General Legal Scenario",
                    template_type=detected_type
                )
                
                # Handle if the engine returns an object instead of a string
                if hasattr(drafted_text, "response"): 
                    drafted_text = drafted_text.response
                
                drafted_text = str(drafted_text)

            except Exception as e:
                drafted_text = f"Error: {str(e)}"

            # 3. CHECK FOR FAILURE BEFORE RESPONDING
            if not drafted_text or "Error" in drafted_text or "fail" in drafted_text.lower():
                return {
                    "response": f"I tried to draft a **{detected_type}**, but encountered an error: {drafted_text}. \n\nPlease provide more details or try again.",
                    "drafted_document": None, # Don't switch tabs
                    "doc_type": None
                }

            # 4. SUCCESS RESPONSE
            return {
                "response": f"Yes, I have generated a **{SUPPORTED_TEMPLATES.get(detected_type, 'Legal Document')}** for you.\n\n👉 **Action:** Please check the 'Document' tab to view and edit it.",
                "drafted_document": drafted_text,
                "doc_type": detected_type,
                "possible_options": list(SUPPORTED_TEMPLATES.keys())
            }

        # --- C. NORMAL CHAT LOGIC ---
        else:
            # We use run_in_threadpool because your real engine might be blocking
            ai_response = await run_in_threadpool(
                query_engine.query,
                user_question=request.query,
                chat_history=request.history or [],
                case_context=request.case_context  # <--- CRITICAL: PASS THE CONTEXT
            )
            
            # Extract answer text
            answer_text = ai_response["answer"] if isinstance(ai_response, dict) else str(ai_response)

            return {
                "response": answer_text,
                "drafted_document": None,
                "doc_type": None
            }
    except Exception as e:
        logger.error(f"Error in chat_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))