import pandas as pd
from sentence_transformers import SentenceTransformer
import chromadb
from tqdm import tqdm
import logging
import sys
import os

# --- Add project root to path ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)
# -------------------------------

# --- UPDATED Imports ---
# Now import the settings object and computed paths
from src.config import settings, PROCESSED_DATA_PATH, CHROMA_DB_PATH, INGEST_LOG_FILE
# ---

# --- Setup logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] - %(message)s",
    handlers=[
        # --- UPDATED Path ---
        logging.FileHandler(INGEST_LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def main():
    """
    Main function to ingest data and metadata from a CSV file
    into a ChromaDB vector database.
    """
    logger.info("Starting data ingestion process...")

    # --- 1. Load Data ---
    # --- UPDATED Path ---
    csv_path = PROCESSED_DATA_PATH 
    logger.info(f"Loading data from '{csv_path}'...")
    
    try:
        df = pd.read_csv(csv_path)
        
        # --- UPDATED Settings ---
        text_col = settings.TEXT_COLUMN_NAME
        id_col = settings.ID_COLUMN_NAME
        
        required_cols = [text_col, id_col]
        # Also include 'source_document' which is vital metadata
        if "source_document" not in df.columns:
             logger.warning("Column 'source_document' not found, metadata will be limited.")
        
        for col in required_cols:
            if col not in df.columns:
                logger.error(f"Missing required column '{col}' in {csv_path}.")
                raise ValueError(f"Missing column: {col}. Available: {df.columns.tolist()}")
        
        df.dropna(subset=[text_col], inplace=True)
        df[text_col] = df[text_col].astype(str)
        texts = df[text_col].tolist()

        # Prepare metadata: drop text_chunk and fill any NAs
        df_meta = df.drop(columns=[text_col], errors='ignore')
        df_meta = df_meta.fillna("") 
        metadatas = df_meta.to_dict('records') 
        
        logger.info(f"Loaded {len(texts)} text chunks and {len(metadatas)} metadata records.")
        
    except FileNotFoundError:
        logger.error(f"Error: The file '{csv_path}' was not found.", exc_info=True)
        logger.error("Did you run 'python scripts/preprocess.py' first?")
        return
    except Exception as e:
        logger.error(f"An error occurred while loading the data: {e}", exc_info=True)
        return

    # --- 2. Initialize Embedding Model ---
    # --- UPDATED Setting ---
    logger.info(f"Loading embedding model '{settings.EMBEDDING_MODEL_NAME}'...")
    try:
        model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}", exc_info=True)
        return
    logger.info("Embedding model loaded.")

    # --- 3. Setup ChromaDB ---
    # --- UPDATED Path ---
    logger.info(f"Setting up ChromaDB client at '{CHROMA_DB_PATH}'...")
    try:
        client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        
        # --- UPDATED Setting ---
        if settings.RESET_DATABASE:
            try:
                logger.warning(
                    f"RESET_DATABASE is True. Deleting old collection: '{settings.CHROMA_COLLECTION_NAME}'"
                )
                # --- UPDATED Setting ---
                client.delete_collection(name=settings.CHROMA_COLLECTION_NAME)
            
            except chromadb.errors.NotFoundError:
                logger.info("Collection not found, no need to delete.")
            except Exception as e:
                logger.error(f"Error deleting collection: {e}", exc_info=True)
                return

        # --- UPDATED Setting ---
        collection = client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME
        )
        
    except Exception as e:
        logger.error(f"Failed to initialize ChromaDB: {e}", exc_info=True)
        return
    
    # --- UPDATED Setting ---
    logger.info(f"ChromaDB collection '{settings.CHROMA_COLLECTION_NAME}' is ready.")
    logger.info(f"Current document count: {collection.count()}")

    # --- 4. Ingest Data in Batches ---
    # --- UPDATED Setting ---
    batch_size = settings.BATCH_SIZE
    logger.info(f"Starting ingestion into ChromaDB in batches of {batch_size}...")
    
    for i in tqdm(range(0, len(texts), batch_size), desc="Ingesting Batches"):
        
        batch_texts = texts[i:i + batch_size]
        batch_metadatas = metadatas[i:i + batch_size]
        
        # 'id_col' was already set using settings, so this line is correct
        batch_ids = df[id_col].iloc[i:i + batch_size].astype(str).tolist()
        
        try:
            batch_embeddings = model.encode(batch_texts).tolist()
        except Exception as e:
            logger.error(f"Failed to encode batch starting at index {i}: {e}")
            continue

        try:
            collection.add(
                ids=batch_ids,
                embeddings=batch_embeddings,
                documents=batch_texts,
                metadatas=batch_metadatas
            )
        except Exception as e:
            logger.error(f"Error adding batch starting at index {i} to ChromaDB: {e}")
            
    logger.info("Ingestion complete!")
    logger.info(f"Total documents in collection: {collection.count()}")

if __name__ == "__main__":
    main()