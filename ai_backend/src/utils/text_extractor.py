import io
import logging
from pypdf import PdfReader
from google.cloud import vision
from starlette.concurrency import run_in_threadpool

# Initialize Logger
logger = logging.getLogger(__name__)

def _google_vision_ocr_sync(file_content: bytes) -> str:
    """
    [Blocking] Sends image content to Google Cloud Vision API for OCR.
    Uses the credentials from your environment/gcp-service-account-key.json.
    """
    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=file_content)
        
        # Perform text detection
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            logger.error(f"Cloud Vision API error: {response.error.message}")
            return ""

        return response.full_text_annotation.text
    except Exception as e:
        logger.error(f"Google Cloud Vision API failed: {e}")
        return ""

async def extract_text_from_file(file_content: bytes, content_type: str, filename: str) -> str:
    """
    Unified Extractor:
    1. PDFs -> pypdf (Local, Fast)
    2. Images -> Google Cloud Vision (High Accuracy OCR)
    """
    text = ""
    try:
        # A. PDF Handling
        if content_type == "application/pdf":
            try:
                reader = PdfReader(io.BytesIO(file_content))
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                
                # If PDF text is empty, it might be a scan.
                if not text.strip():
                    text = "[Scanned PDF - Text extraction incomplete. Please upload as image for best results.]"
            except Exception as e:
                text = f"[Error reading PDF: {e}]"

        # B. Image Handling (Google Cloud Vision)
        elif content_type in ["image/png", "image/jpeg", "image/jpg", "image/webp"]:
            # Run the blocking Google call in a separate thread so we don't freeze the server
            text = await run_in_threadpool(_google_vision_ocr_sync, file_content)
            
            if not text:
                text = "[OCR Analysis returned no text]"

        # C. Plain Text
        elif "text" in content_type or "json" in content_type:
            text = file_content.decode("utf-8")
            
        else:
            text = "[Unsupported file type]"

    except Exception as e:
        logger.error(f"Extraction Error: {e}")
        return ""
        
    return text