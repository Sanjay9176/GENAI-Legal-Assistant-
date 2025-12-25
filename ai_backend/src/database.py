# src/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# Create the async MongoDB client
# We use settings.MONGO_DB_URL as defined in src/config.py
client = AsyncIOMotorClient(settings.MONGO_DB_URL)

# Choose the database
db = client[settings.MONGO_DB_NAME]

# --- Collections ---
# These are the specific "tables" inside your MongoDB
cases_collection = db["cases"]
users_collection = db["users"]  # <--- Essential for the new Auth system

# Optional: dependency helper for FastAPI (Standard practice)
async def get_db():
    """
    Simple helper if you ever want to inject the db with Depends.
    """
    return db