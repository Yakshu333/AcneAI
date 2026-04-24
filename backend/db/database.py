from pymongo import MongoClient
import os
from datetime import datetime
from bson import ObjectId

# You can override this using environment variables if needed
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "acne_ai"

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db["users"]
    history_collection = db["history"]
    print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    db = None

def get_user_by_email(email):
    if db is None: return None
    return users_collection.find_one({"email": email})

def create_user(user_data):
    if db is None: return None
    user_data["created_at"] = datetime.utcnow()
    result = users_collection.insert_one(user_data)
    return str(result.inserted_id)

def save_prediction_history(user_id, image_filename, prediction_type, confidence):
    if db is None: return None
    history_entry = {
        "user_id": ObjectId(user_id),
        "image": image_filename,
        "prediction": prediction_type,
        "confidence": confidence,
        "timestamp": datetime.utcnow()
    }
    result = history_collection.insert_one(history_entry)
    return str(result.inserted_id)

def get_user_history(user_id):
    if db is None: return []
    # Sort by timestamp descending
    cursor = history_collection.find({"user_id": ObjectId(user_id)}).sort("timestamp", -1)
    
    formatted_history = []
    for entry in cursor:
        entry["_id"] = str(entry["_id"])
        entry["user_id"] = str(entry["user_id"])
        # Format date for frontend
        entry["date"] = entry["timestamp"].strftime("%Y-%m-%d %H:%M")
        del entry["timestamp"]
        formatted_history.append(entry)
        
    return formatted_history
