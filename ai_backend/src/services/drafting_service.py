# src/services/drafting_service.py
import google.generativeai as genai
import json
from src.config import settings

class DraftingService:
    def __init__(self):
        # 1. Configure API using the settings we trust
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        # 2. Use the smart model (Gemini 2.0 Flash)
        self.model_name = "gemini-2.0-flash"

    async def generate_structured_case(self, user_input: str, category: str, jurisdiction: dict):
        """
        Generates the Draft, Timeline, and Facts in one single AI call.
        """
        print(f"🤖 Drafting Service: Generating content for '{category}'...")

        # 3. The Strict Prompt
        # We force the AI to return ONLY JSON.
        prompt = f"""
        You are a senior Indian Legal Expert. 
        Context:
        - User Input: "{user_input}"
        - Category: {category}
        - Jurisdiction: {jurisdiction.get('state')}, {jurisdiction.get('district')}

        TASK:
        Generate a comprehensive legal response. You must return a SINGLE JSON Object with exactly these three keys:
        
        1. "structured_facts": Extract key entities (Names, Dates, Amounts) as key-value pairs.
        2. "timeline": A list of procedural steps (e.g., "Step 1: Send Notice", "Step 2: File Complaint").
        3. "draft_text": The actual legal document or advice text (formatted with markdown).

        FORMAT EXAMPLE:
        {{
            "structured_facts": {{
                "opponent_name": "Ramesh",
                "amount_due": "50,000 INR"
            }},
            "timeline": [
                {{"step_id": 1, "title": "Send Legal Notice", "status": "pending"}},
                {{"step_id": 2, "title": "File Civil Suit", "status": "locked"}}
            ],
            "draft_text": "# LEGAL NOTICE \\n\\n To, Mr. Ramesh..."
        }}
        """

        try:
            # 4. Call Gemini
            model = genai.GenerativeModel(self.model_name)
            
            # Request the content
            response = model.generate_content(prompt)

            # 5. Clean the response
            # Sometimes AI wraps JSON in ```json ... ``` blocks. We remove them.
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            
            # 6. Parse into Python Dictionary
            return json.loads(clean_text)

        except Exception as e:
            print(f"❌ Drafting Error: {e}")
            # Return a safe error structure so the app doesn't crash
            return {"error": str(e)}

# Create a singleton instance to be used by the Route
drafting_service = DraftingService()