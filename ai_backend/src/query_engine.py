# src/query_engine.py
import os
import sys
import time
import logging
import asyncio 
from google.cloud import vision  
from typing import List, Dict, Optional, Any
import chromadb
from sentence_transformers import SentenceTransformer , CrossEncoder
import google.generativeai as genai
from fastapi.concurrency import run_in_threadpool # <-- Import for non-blocking calls

# --- CORRECTED Imports ---
from .config import settings, CHROMA_DB_PATH, QUERY_LOG_FILE, SAMPLE_TEMPLATES_DIR
# ---

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] - %(message)s",
    handlers=[
        logging.FileHandler(QUERY_LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


# --- CORRECTED: Configure Gemini Client ---
try:
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    logger.info("Gemini API configured successfully using settings.")
except Exception as e:
    logger.error(f"FATAL: Failed to configure Gemini API key from settings: {e}", exc_info=True)
    if not settings.GOOGLE_API_KEY:
         logger.error("Ensure GOOGLE_API_KEY is defined in your .env file.")
    raise RuntimeError("Could not configure Gemini API key from settings.")
# ---


class QueryEngine:
    def __init__(self):
        # --- Startup Header ---
        logger.info("=" * 60)
        logger.info("🚀 Starting Gen-Vidhik Sahayak Query Engine")
        logger.info("=" * 60)

        # --- 1. Load Embedding Model ---
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}")
        try:
            self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        except Exception as e:
            logger.error("Failed to load embedding model", exc_info=True)
            raise RuntimeError(f"Failed to load embedding model: {e}")

        # --- 2. Load Reranker Model (NEW) ---
        logger.info(f"Loading Reranker Model: {settings.RERANKER_MODEL_NAME}")
        try:
            self.reranker_model = CrossEncoder(settings.RERANKER_MODEL_NAME)
            logger.info("✅ Reranker model loaded.")
        except Exception as e:
            logger.error(f"Failed to load Reranker model: {e}", exc_info=True)
            self.reranker_model = None

        # --- 3. Connect to ChromaDB ---
        logger.info(f"Connecting to ChromaDB at: {CHROMA_DB_PATH}")
        try:
            client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
            self.collection = client.get_collection(
                name=settings.CHROMA_COLLECTION_NAME
            )
            logger.info("ChromaDB connection successful.")
        except Exception as e:
            logger.error("Failed to connect to ChromaDB", exc_info=True)
            raise RuntimeError(f"Failed to connect to ChromaDB: {e}")

        # --- 4. Initialize Gemini Model ---
        logger.info(f"Initializing Gemini model: {settings.GEMINI_MODEL_NAME}")
        try:
            self.gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
        except Exception as e:
            logger.error("Failed to initialize Gemini model", exc_info=True)
            raise RuntimeError(f"Failed to initialize Gemini model: {e}")

        # --- RAG Settings ---
        self.top_k = settings.TOP_K_RESULTS
        self.n_to_retrieve = settings.N_TO_RETRIEVE 

        # --- 5. Document Map ---
        self.document_map = {
            "IPC": "raw/Legal_Corpus/full(ipc).pdf",
            "CrPC": "raw/Legal_Corpus/Code_of_Criminal_Procedure_1973.pdf",
            "Consumer": "raw/Legal_Corpus/consumer_protection_act_2019.pdf",
            "RTI": "raw/Legal_Corpus/Right_to_Information_Act_2005.pdf",
            "Contract": "raw/Legal_Corpus/Indian_Contract_Act_1872.pdf",
            "Negotiable": "raw/Legal_Corpus/Negotiable_Instruments_Act_1881.pdf"
        }

        # --- 6. Keyword map (STRONGER FOR SCENARIOS) ---
        self.keyword_map = {
            "IPC": ["theft", "murder", "crime", "punishment", "section", "bailable", "offence", "penal code", "homicide", "negligence", "assault"],
            "CrPC": ["arrest", "trial", "appeal", "bail", "procedure", "investigation", "magistrate", "custody", "warrant"],
            "Consumer": ["refund", "complaint", "consumer", "defect", "product", "service", "unfair trade", "deficiency", "liability"],
            "RTI": ["information", "RTI", "public authority", "transparency", "pio", "application", "appeal"],
            "Contract": ["contract", "agreement", "offer", "acceptance", "void", "breach", "consideration", "debt", "money due", "loan", "repayment", "rent"], 
            "Negotiable": ["cheque", "bill of exchange", "promissory note", "endorsement", "dishonour", "bounce", "money"] 
        }

        # --- 7. Cache ---
        self.classification_cache = {}
        
        # --- 8. Dynamically Load Document Templates (NEW) ---
        self.template_map = {}
        self._load_templates() # Call the new helper function

        # --- Final Startup Log ---
        logger.info(f"Smart filter map initialized with {len(self.document_map)} documents.")
        logger.info(
            f"Loaded Config → Embed Model: {settings.EMBEDDING_MODEL_NAME}, LLM: {settings.GEMINI_MODEL_NAME}, Top K: {self.top_k}"
        )
        logger.info(f"✅ Found and loaded {len(self.template_map)} document templates.")
        logger.info("✅ Query Engine initialization complete.\n")


    # --- Helper: Safe Gemini Call with Retry (unchanged) ---
    def _safe_generate(self, prompt: str):
        for attempt in range(2):
            try:
                return self.gemini_model.generate_content(prompt)
            except Exception as e:
                if "429" in str(e): 
                    logger.warning("Rate limit hit. Retrying in 2 seconds...")
                    time.sleep(2)
                    continue
                logger.error(f"Gemini API error during generation: {e}", exc_info=False)
                raise

    # --- Reframe Follow-Up Question (unchanged) ---
    def _reframe_question(
        self, question: str, chat_history: List[Dict[str, str]]
    ) -> str:
        if not chat_history:
            return question
        history_str = "\n".join(
            [f"{msg['role']}: {msg['content']}" for msg in chat_history]
        )
        reframe_prompt = f"""
        Given the following conversation history and a follow-up question, rephrase the
        follow-up question to be a standalone question fully understandable without the history.

        Chat History:
        ---
        {history_str}
        ---
        Follow-up Question: "{question}"

        Standalone Question:"""
        try:
            logger.info("Re-framing question based on chat history...")
            response = self._safe_generate(reframe_prompt)
            standalone_question = getattr(response, "text", "").strip()
            if standalone_question:
                logger.info(f"Re-framed question → '{standalone_question}'")
                return standalone_question
            else:
                logger.warning("Re-framing returned empty result. Using original question.")
                return question
        except Exception as e:
            logger.warning(f"Could not reframe question, using original: {e}", exc_info=True)
            return question

    # --- Fallback keyword classifier (unchanged) ---
    def _fallback_keyword_classify(self, question: str) -> str:
        question_lower = question.lower()
        best_match, best_score = "General", 0 
        for category, keywords in self.keyword_map.items():
            score = sum(1 for kw in keywords if kw in question_lower)
            if score > 0 and score >= best_score:
                best_match, best_score = category, score
        logger.info(f"Fallback classification result: '{best_match}' (Score: {best_score})")
        return best_match

    # --- Helper to build the where_filter dict (unchanged) ---
    def _build_filter(self, category: str) -> Optional[Dict]:
        PROCEDURAL_DEBT_GUIDES = [
            "raw/Procedural_Guides/debt_recovery_notice_procedure.txt",
            "raw/Procedural_Guides/cheque_bounce_procedure.txt"
        ]
        if category in self.document_map:
            doc_filename = self.document_map[category]
            if category == "Contract" or category == "Negotiable":
                target_documents = [doc_filename] + PROCEDURAL_DEBT_GUIDES
                logger.info(f"Applying HYBRID filter for Debt/Contract. Targeting {len(target_documents)} sources.")
                return {"source_document": {"$in": target_documents}}
            logger.info(f"Applying SINGLE filter for '{category}'.")
            return {"source_document": doc_filename}
        logger.info(f"No document filter applied (category='{category}'). Searching all documents.")
        return None

    # --- Smart Filter Classification (unchanged) ---
    def _get_smart_filter(self, question: str) -> Optional[Dict]:
        question = question.strip()
        if not question:
            return None
        if question in self.classification_cache:
            cached_category = self.classification_cache[question]
            logger.info(f"Using cached classification: '{cached_category}'")
            return self._build_filter(cached_category)
        logger.info("Classifying query for smart filtering...")
        categories = "\n".join([f"- {key}" for key in self.document_map.keys()])
        classifier_prompt = f"""
        You are an expert Indian legal document classifier. Analyze the user's question
        and determine which single legal document category is most relevant for finding the answer.

        Available Categories:
        {categories}
        - General: (Use if the question is non-legal, conversational, or doesn't fit others)

        User Question: "{question}"

        Respond with ONLY the single most relevant category name from the list. Do not add explanations.
        Category:"""
        try:
            response = self._safe_generate(classifier_prompt)
            raw_category = getattr(response, "text", "General").strip()
            category = "General" 
            for cat_key in self.document_map.keys():
                 if cat_key in raw_category:
                      category = cat_key
                      break 
            if category == "General" and category not in raw_category:
                 logger.warning(f"AI classifier returned unexpected text: '{raw_category}'. Using fallback.")
                 category = self._fallback_keyword_classify(question)
            self.classification_cache[question] = category
            return self._build_filter(category)
        except Exception as e:
            logger.warning(f"Smart classification failed: {e}. Using fallback classifier.")
            category = self._fallback_keyword_classify(question)
            self.classification_cache[question] = category
            return self._build_filter(category)

    # --- Build Prompt for Gemini (unchanged) ---
    def _build_prompt(
        self, question: str, context_chunks: List[str], chat_history: List[Dict[str, str]], case_context: str = None
    ) -> str:
        
        # 1. Build Context String
        context = "\n\n---\n\n".join(context_chunks)
        
        # 2. Build History String
        history_prompt_section = ""
        if chat_history:
            history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
            history_prompt_section = f"Conversation History:\n{history_str}\n"

        # 3. Build Case Context String (THE FIX)
        case_context_section = ""
        if case_context:
            case_context_section = f"""
            === CURRENT CASE FACTS ===
            The user is asking about this specific situation:
            "{case_context}"
            ==========================
            """

        system_role = "You are 'Gen-Vidhik Sahayak', an expert legal AI. Answer strictly based on the provided context."

        prompt = f"""
        {system_role}
        
        {case_context_section}

        {history_prompt_section}

        Provided Legal Knowledge (Laws/Acts):
        --- START LEGAL CONTEXT ---
        {context}
        --- END LEGAL CONTEXT ---

        User's Question:
        "{question}"

        Answer:
        """
        return prompt

    # --- Main Query Method (unchanged) ---
    def query(
        self, 
        user_question: str, 
        chat_history: Optional[List[Dict[str, str]]] = None,
        case_context: Optional[str] = None  # <--- [UPDATE] Added new argument
    ) -> Dict[str, Any]:
        
        if chat_history is None:
            chat_history = []
            
        if not user_question.strip():
            logger.warning("Received empty query.")
            return {"answer": "Please provide a valid question.", "sources": []}
            
        start_time = time.time()
        logger.info(f"Processing query → '{user_question}'")
        
        # 1. Reframe and Filter
        standalone_question = self._reframe_question(user_question, chat_history)
        where_filter = self._get_smart_filter(standalone_question)
        
        # 2. Embed
        try:
            question_embedding = self.embedding_model.encode(standalone_question).tolist()
        except Exception as e:
            logger.error(f"Failed to encode question: {e}", exc_info=True)
            return {"answer": "Error encoding question.", "sources": []}
            
        # 3. Retrieve
        N_TO_RETRIEVE = settings.N_TO_RETRIEVE
        logger.info(f"Searching database (top {N_TO_RETRIEVE} for reranking). Filter: {where_filter or 'None'}")
        
        try:
            results = self.collection.query(
                query_embeddings=[question_embedding],
                n_results=N_TO_RETRIEVE, 
                where=where_filter,
                include=['metadatas', 'documents']
            )
            context_chunks = results.get("documents", [[]])[0]
            sources_metadata = results.get("metadatas", [[]])[0]
            
            if not context_chunks:
                logger.warning("No relevant results found in the database for this query.")
                return { "answer": "Based on the provided documents, I cannot answer this question.", "sources": [] }
                
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}", exc_info=True)
            return { "answer": "Error retrieving information from the database.", "sources": [] }
            
        # 4. Rerank
        reranked_chunks = context_chunks
        reranked_metadata = sources_metadata
        
        if self.reranker_model is not None:
            logger.info(f"Reranking {len(context_chunks)} chunks to select top {self.top_k}...")
            sentences_to_rank = [[standalone_question, chunk] for chunk in context_chunks]
            rerank_scores = self.reranker_model.predict(sentences_to_rank).tolist()
            
            scored_results = sorted(
                list(zip(rerank_scores, context_chunks, sources_metadata)), 
                key=lambda x: x[0], 
                reverse=True
            )
            
            top_k_results = scored_results[:self.top_k]
            reranked_chunks = [result[1] for result in top_k_results]
            reranked_metadata = [result[2] for result in top_k_results]
            logger.info(f"✅ Reranking complete. Using top {self.top_k} chunks.")
            
        context_chunks = reranked_chunks
        sources_metadata = reranked_metadata
        
        # 5. Build Prompt and Generate
        # <--- [UPDATE] Passing case_context to _build_prompt
        prompt = self._build_prompt(standalone_question, context_chunks, chat_history, case_context) 
        
        logger.info("Asking Gemini for final answer...")
        try:
            response = self._safe_generate(prompt)
            answer = "Could not generate answer."
            
            if response and response.text:
                answer = response.text.strip()
            elif response and response.candidates:
                 try:
                      answer = response.candidates[0].content.parts[0].text.strip()
                 except (IndexError, AttributeError):
                      logger.warning("Could not extract text from response candidates.")
            
            logger.info("Gemini answer received.")
            
            output_sources = list(set([meta.get('source_document') for meta in sources_metadata if meta and 'source_document' in meta]))
            end_time = time.time()
            logger.info(f"Query processed successfully in {end_time - start_time:.2f} seconds.")
            
            return {"answer": answer, "sources": output_sources}
            
        except Exception as e:
            logger.error(f"Error calling Gemini API for final answer: {e}", exc_info=True)
            return { "answer": "Error generating answer from the AI model.", "sources": [] }
    # ---
    # --- [NEW] HELPER FUNCTIONS FOR ADVANCED DRAFTING ---
    # ---

    async def _classify_template_type(self, scenario: str) -> Optional[str]:
        """
        [NEW] Uses the LLM to classify a scenario against the available templates.
        Returns a matching template key or None.
        """
        logger.info("Attempting to auto-classify document type...")
        
        # Get the list of human-readable template keys
        available_templates = "\n".join([f"- {key}" for key in self.template_map.keys()])
        
        classifier_prompt = f"""
        You are an expert legal assistant. A user has provided a scenario and needs a document.
        Analyze the scenario and determine which *one* of the following available templates is the best fit.

        Available Templates:
        {available_templates}

        User's Scenario:
        "{scenario}"

        Respond with *only* the single best matching template key (e.g., "debt_recovery_notice") or respond with "None" if no template is a good match.

        Matching Template Key:
        """
        
        try:
            response = await run_in_threadpool(self._safe_generate, classifier_prompt)
            template_key = getattr(response, "text", "None").strip().lower()
            
            if template_key in self.template_map:
                logger.info(f"Auto-classification successful: Matched '{template_key}'")
                return template_key
            else:
                logger.info("Auto-classification found no matching template.")
                return None
        except Exception as e:
            logger.warning(f"Template classification failed: {e}. Defaulting to no template.")
            return None

    async def _draft_document_from_scratch(self, scenario: str) -> str:
        """
        [NEW] Generative fallback: Drafts a document from scratch using only the scenario.
        """
        logger.info("Drafting document from scratch (no template).")
        
        drafting_prompt = f"""
        You are an expert Indian paralegal. A user has provided a scenario and needs a formal legal document drafted from scratch.

        USER'S SCENARIO:
        "{scenario}"

        INSTRUCTIONS:
        1.  Analyze the scenario and identify the correct type of legal document required (e.g., Legal Notice, Application, etc.).
        2.  Draft a complete, professional, and legally-sound document that is ready to be used.
        3.  The document must be formatted correctly and use formal legal language appropriate for India.
        4.  Ensure all facts from the user's scenario are correctly included.
        5.  Do not invent facts. If critical information is missing, use clear placeholders like [INSERT SENDER'S FULL NAME] or [INSERT DATE].
        6.  The final output must be *only* the drafted document text. Do not add any extra conversation.

        FINAL DRAFTED DOCUMENT:
        """
        try:
            response = await run_in_threadpool(self._safe_generate, drafting_prompt)
            drafted_text = getattr(response, "text", "Error: Failed to generate draft.")
            return drafted_text.strip()
        except Exception as e:
            logger.error(f"Error calling Gemini API for scratch drafting: {e}", exc_info=True)
            return "Error: The AI model failed to generate the document from scratch."

    # --- HELPER FUNCTIONS FOR DRAFTING (from previous step) ---
    def _load_templates(self):
        """
        Dynamically scans the templates directory and builds the template map.
        This is called once during initialization.
        """
        logger.info(f"Loading document templates from: {SAMPLE_TEMPLATES_DIR}")
        self.template_map = {}
        try:
            for filename in os.listdir(SAMPLE_TEMPLATES_DIR):
                if filename.endswith(".txt"):
                    # Create a key from the filename, e.g., "cheque_bounce_notice.txt" -> "cheque_bounce_notice"
                    template_key = filename.replace(".txt", "").lower()
                    self.template_map[template_key] = filename
            
            logger.info(f"✅ Found and loaded {len(self.template_map)} templates: {list(self.template_map.keys())}")
        
        except FileNotFoundError:
            logger.error(f"FATAL: Sample templates directory not found at: {SAMPLE_TEMPLATES_DIR}")
        except Exception as e:
            logger.error(f"FATAL: Failed to load document templates: {e}", exc_info=True)

    def _load_template_text(self, filename: str) -> str:
        """
        Synchronous function to read a template file. To be run in a thread.
        """
        template_path = os.path.join(SAMPLE_TEMPLATES_DIR, filename)
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            logger.error(f"Template file not found at: {template_path}")
            raise
        except Exception as e:
            logger.error(f"Error reading template file {template_path}: {e}", exc_info=True)
            raise

    async def draft_document(self, scenario: str, template_type: Optional[str] = "auto") -> str:
        """
        [UPDATED] Main drafting function.
        1. STRATEGY A (Smart): Tries to use specific templates if available.
        2. STRATEGY B (Fallback): Generates from scratch if no template matches.
        """
        logger.info(f"Starting document draft request. Type: '{template_type}'")

        # --- STRATEGY A: TEMPLATE BASED (Smart Mode) ---
        try:
            final_template_key = None
            
            # 1. Attempt Auto-Classification
            if template_type == "auto":
                final_template_key = await self._classify_template_type(scenario)
            # 2. Check if user requested a valid specific template
            elif template_type and template_type.lower() in self.template_map:
                final_template_key = template_type.lower()

            # 3. If a template exists, try to fill it
            if final_template_key:
                logger.info(f"✅ Found matching template: {final_template_key}")
                template_filename = self.template_map.get(final_template_key)
                
                # Load template text (running in threadpool to avoid blocking)
                template_text = await run_in_threadpool(self._load_template_text, template_filename)

                drafting_prompt = f"""
                You are an expert Indian paralegal. Your task is to fill in the placeholders in the document template.

                SCENARIO: "{scenario}"

                TEMPLATE:
                "{template_text}"

                CRITICAL INSTRUCTIONS:
                1. Use facts from the SCENARIO to fill the template.
                2. **DO NOT INVENT FACTS:** If a specific detail (like Advocate Name, Father's Name, or Date) is NOT in the scenario, you MUST leave the placeholder exactly as it is (e.g., keep [ADVOCATE_NAME] or [DATE]).
                3. Do NOT use generic names like "Rajesh Kumar" or "John Doe" unless explicitly stated in the scenario.
                4. Return ONLY the final document text.
                """
                
                # Use your existing _safe_generate helper
                response = await run_in_threadpool(self._safe_generate, drafting_prompt)
                
                # Extract text safely
                result_text = getattr(response, "text", "").strip()
                if result_text:
                    return result_text
                else:
                    logger.warning("⚠️ Template generation returned empty text. Falling back to scratch.")

        except Exception as e:
            logger.warning(f"⚠️ Template drafting failed ({e}). Falling back to scratch drafting.")
            # We do NOT return error here. We let it fall through to Strategy B.

        # --- STRATEGY B: DRAFT FROM SCRATCH (General Mode) ---
        # This runs if Strategy A fails OR if no template was found.
        
        logger.info("✍️ Drafting from scratch (General Prompt)...")
        
        # Use the 'template_type' name if available, otherwise just 'Legal Document'
        doc_label = template_type if template_type and template_type != "auto" else "Legal Document"

        drafting_prompt = (
            f"You are an expert Indian Legal AI.\n"
            f"Draft a formal legal document of type: '{str(doc_label).upper()}'.\n"
            f"FACTS OF THE CASE: {scenario}\n\n"
            f"INSTRUCTIONS:\n"
            f"- Use standard Indian legal formatting.\n"
            f"- Include placeholders like [DATE], [LOCATION], [SIGNATURE] where needed.\n"
            f"- The tone should be professional, precise, and legally sound.\n"
            f"- Return ONLY the document text."
        )

        try:
            # We use run_in_threadpool + _safe_generate because we are using Google GenAI directly
            response = await run_in_threadpool(self._safe_generate, drafting_prompt)
            
            result = getattr(response, "text", "Error: Could not generate document.")
            return result.strip()
            
        except Exception as e:
            logger.error(f"❌ Scratch drafting failed: {e}")
            return f"Error: Could not generate document. Reason: {str(e)}"
        
    def _get_text_from_image_sync(self, file_content: bytes) -> str:
        """
        [Sync Helper] Sends image content to Google Cloud Vision API for OCR.
        This is a blocking I/O call and must be run in a thread.
        """
        try:
            # This automatically finds the GOOGLE_APPLICATION_CREDENTIALS
            # environment variable you set in your .env file.
            client = vision.ImageAnnotatorClient()
            
            image = vision.Image(content=file_content)
            
            logger.info("Sending request to Google Cloud Vision API...")
            # Perform text detection (OCR)
            response = client.document_text_detection(image=image)
            
            if response.error.message:
                logger.error(f"Cloud Vision API error: {response.error.message}")
                raise Exception(response.error.message)
                
            return response.full_text_annotation.text
        
        except Exception as e:
            logger.error(f"Google Cloud Vision API failed: {e}", exc_info=True)
            # Re-raise the exception to be caught by the async wrapper
            raise

    async def get_text_from_image(self, file_content: bytes) -> str:
        """
        [Async Wrapper] Asynchronously extracts text from image bytes using OCR.
        """
        logger.info("Extracting text from uploaded file via OCR...")
        try:
            # Run the blocking I/O call in a separate thread
            extracted_text = await run_in_threadpool(
                self._get_text_from_image_sync, file_content
            )
            logger.info(f"Successfully extracted {len(extracted_text)} characters.")
            return extracted_text
        except Exception as e:
            # Return a specific error message
            return f"Error: Could not extract text from file. The API reported: {e}"

    async def answer_from_document(self, document_text: str, question: str) -> str:
        """
        [Async] Answers a question based *only* on the provided document text.
        This uses "short-term memory" (the prompt) instead of ChromaDB.
        """
        logger.info(f"Answering question from document: '{question}'")

        # 1. Engineer the "Short-Term Memory" Prompt
        prompt = f"""
        You are an AI assistant. Your task is to answer the user's question based *only* on the text from the single document provided below.
        You must not use any external knowledge. 
        If the answer is not found in the document, you must state: "Based on the document provided, I cannot answer this question."

        --- START OF DOCUMENT TEXT ---
        {document_text}
        --- END OF DOCUMENT TEXT ---

        User's Question:
        "{question}"

        Answer:
        """

        # 2. Call the LLM (non-blocking)
        try:
            # Use run_in_threadpool for the synchronous _safe_generate call
            response = await run_in_threadpool(self._safe_generate, prompt)
            
            answer = getattr(response, "text", "Error: Failed to generate an answer.")
            return answer.strip()
            
        except Exception as e:
            logger.error(f"Error calling Gemini API for document Q&A: {e}", exc_info=True)
            return "Error: The AI model failed to generate an answer from the document."
    # ... inside class QueryEngine ...

    # ==========================================================
    # [NEW] CASE ANALYSIS (TRIAGE) METHOD
    # ==========================================================
    async def analyze_legal_situation(self, situation_text: str) -> str:
        """
        Analyzes a situation and returns a strict JSON string containing
        facts, laws, strategy, and initial advice.
        """
        logger.info("Analyzing situation for structured JSON output...")

        prompt = f"""
        You are an expert Indian Legal Assistant (Gen-Vidhik Sahayak).
        
        TASK:
        Analyze the following user situation and extract structured legal data.
        
        USER SITUATION:
        "{situation_text}"
        
        RESPONSE FORMAT:
        You must return ONLY a valid JSON object. Do not add markdown formatting (like ```json).
        The JSON must have exactly these keys:
        {{
            "facts": {{
                "extracted_date": "YYYY-MM-DD or 'Not mentioned'",
                "amount_involved": "Amount or 'Not mentioned'",
                "key_parties": "Names or roles involved",
                "summary": "One sentence summary of the event"
            }},
            "laws": [
                "List of specific Indian Acts/Sections applicable (e.g., 'IPC Section 420', 'Negotiable Instruments Act Section 138')"
            ],
            "strategy": "A clear, step-by-step numbered list of what the user should do next.",
            "initial_advice": "A brief, empathetic professional legal opinion (max 3 sentences)."
        }}
        """

        try:
            # Re-using the threadpool wrapper for safety
            response = await run_in_threadpool(self._safe_generate, prompt)
            
            # Extract text
            analysis_text = getattr(response, "text", "{}")
            
            # Clean up potential markdown formatting from LLM
            cleaned_text = analysis_text.replace("```json", "").replace("```", "").strip()
            
            return cleaned_text

        except Exception as e:
            logger.error(f"Error during case analysis: {e}", exc_info=True)
            # Return a fallback JSON string so frontend doesn't crash
            return '{"facts": {}, "laws": ["Error analyzing"], "strategy": "Please try again.", "initial_advice": "AI Service Error."}'
# --- CLI Testing (unchanged) ---
if __name__ == "__main__":
    try:
        qe = QueryEngine()

        print("\n" + "=" * 60)
        print("--- Gen-Vidhik Sahayak CLI Test ---")
        print("Type 'exit' or 'quit' to end.")
        print("=" * 60)

        while True:
            question = input("\nAsk your legal question: ")
            if question.lower() in ["exit", "quit"]:
                break
            if not question.strip():
                continue

            result = qe.query(question)

            print("\nAI Answer:\n", result["answer"])
            print("\nSources:")
            if result.get("sources"):
                for src in result["sources"]:
                    print(f"  - {src}")
            else:
                print("  - No sources cited.")
            print("-" * 60)

    except Exception as e:
        logger.error(f"Failed to run QueryEngine CLI: {e}", exc_info=True)