import fitz  # PyMuPDF
import os
import pandas as pd
import re
import unicodedata
import logging
from tqdm import tqdm
from typing import List, Dict, Optional, Any
import sys

# --- Import Configuration and Libraries ---
# This block must come BEFORE importing from 'src'
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)
# -------------------------------

# --- CORRECTED IMPORTS: Use settings object and computed paths ---
# Assuming these paths and settings are correctly defined in src.config
from src.config import settings, DATA_DIR, PROCESSED_DATA_PATH, INGEST_LOG_FILE
from langchain.text_splitter import RecursiveCharacterTextSplitter

# --- Setup logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] - %(message)s",
    handlers=[
        logging.FileHandler(INGEST_LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


def clean_text(text: str) -> str:
    """
    Cleans raw text by normalizing unicode, fixing hyphenation, and handling whitespace.
    """
    # Fix common encoding artifacts
    text = text.replace('â€™', "'").replace('â€œ', '"').replace('â€', '"')
    text = text.replace('â€”', '-').replace('â€¦', '...')

    # Normalize unicode characters
    text = unicodedata.normalize("NFKC", text)

    # Fix words broken by hyphenation at line breaks (e.g., "docu-\nment" -> "document")
    text = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', text)

    # Remove common PDF artifacts (e.g., page numbers or section labels)
    text = re.sub(r'\d+\s+SECTIONS', '', text)

    # Remove excessive whitespace, newlines, and tabs
    text = re.sub(r'\s+', ' ', text)

    return text.strip()

def extract_text_from_file(file_path: str, file_extension: str) -> Optional[str]:
    """
    Extracts and cleans text based on file type (.pdf or .txt).
    """
    full_text = ""
    try:
        if file_extension == ".pdf":
            # --- PDF Extraction (using PyMuPDF/fitz) ---
            with fitz.open(file_path) as doc:
                # Joining pages directly to get raw text
                full_text = "".join(page.get_text() for page in doc)

        elif file_extension == ".txt":
            # --- TXT Extraction (simple read) ---
            with open(file_path, 'r', encoding='utf-8') as f:
                full_text = f.read()

        else:
            logger.warning(f"Skipping unsupported file type: {file_extension}")
            return None

        return clean_text(full_text)

    except Exception as e:
        logger.error(f"Error reading or processing {file_path}: {e}", exc_info=True)
        return None


def find_files_recursively(root_dir: str, extensions: tuple = (".pdf", ".txt")) -> List[str]:
    """Finds all files with given extensions in root_dir and its subdirectories."""
    file_list = []
    # os.walk is essential for processing subfolders
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith(extensions):
                file_list.append(os.path.join(dirpath, filename))
    return file_list


def main():
    """
    Main preprocessing pipeline for PDFs and TXT files.
    """
    logger.info("--- Starting PDF/TXT Preprocessing Script (v2.0 with Path Normalization) ---")

    # --- CORRECT STARTING POINT: ai_backend/data ---
    # DATA_DIR should point to the root of your raw data, e.g., 'data/raw'
    raw_data_root = DATA_DIR
    output_csv = PROCESSED_DATA_PATH

    # Find all data files (PDFs and TXTs) in all subfolders of data/raw
    all_files = find_files_recursively(raw_data_root)

    if not all_files:
        logger.error(f"No PDF or TXT files found in {raw_data_root}. Exiting.")
        return

    logger.info(f"Found {len(all_files)} files to process (.pdf and .txt).")

    all_chunks: List[Dict[str, Any]] = []

    # Initialize the text splitter (uses settings object for size/overlap)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len
    )

    for file_path in tqdm(all_files, desc="Processing Files"):
        # Use the relative path from DATA_DIR as the source document identifier
        source_identifier = os.path.relpath(file_path, raw_data_root)
        file_extension = os.path.splitext(file_path)[1].lower()

        # --- FIX: NORMALIZE PATH SEPARATOR to use forward slashes for consistency ---
        source_identifier_normalized = source_identifier.replace(os.sep, '/')
        # ------------------------------------------------------------

        logger.info(f"Processing: {source_identifier_normalized}") # Log the normalized path

        # 1. Extract and clean text
        document_text = extract_text_from_file(file_path, file_extension)

        if not document_text:
            logger.warning(f"Skipping {source_identifier_normalized} due to empty content or read error.")
            continue

        # 2. Split the text into chunks
        chunks = text_splitter.split_text(document_text)

        # 3. Create metadata for each chunk (Use Normalized Path)
        for i, chunk_text in enumerate(chunks):
            if chunk_text.strip():
                all_chunks.append({
                    # --- USE NORMALIZED PATH as the consistent document identifier ---
                    "source_document": source_identifier_normalized,
                    # -----------------------------------------------------------------
                    "chunk_id": f"{os.path.basename(file_path)}_chunk_{i+1}",
                    "text_chunk": chunk_text
                })

    if not all_chunks:
        logger.error("No text chunks were created. Check file content and log file.")
        return

    # 4. Save all chunks to a single CSV
    logger.info(f"Successfully created {len(all_chunks)} potential text chunks.")
    chunk_df = pd.DataFrame(all_chunks)

    try:
        # Final cleanup: drop duplicates and rows with empty text (using settings)
        # Note: ID_COLUMN_NAME is likely 'chunk_id' and TEXT_COLUMN_NAME is 'text_chunk'
        chunk_df.drop_duplicates(subset=[settings.ID_COLUMN_NAME], inplace=True)
        chunk_df = chunk_df[chunk_df[settings.TEXT_COLUMN_NAME].str.strip() != ""]

        chunk_df.to_csv(output_csv, index=False, encoding="utf-8")
        logger.info(f"✅ All {len(chunk_df)} final chunks saved to {output_csv}")
    except Exception as e:
        logger.error(f"Failed to save CSV to {output_csv}: {e}", exc_info=True)

    logger.info("--- Preprocessing Script Finished ---")

if __name__ == "__main__":
    main()