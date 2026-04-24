import os
import shutil
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from model.cnn_model import load_model, predict_acne_type
from db.database import save_prediction_history

app = FastAPI(title="Acne AI API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load the CNN Model on startup
@app.on_event("startup")
async def startup_event():
    load_model()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Pydantic Models for Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/predict")
async def predict(file: UploadFile = File(...), userId: Optional[str] = Form(None)):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed. Please upload PNG, JPG, JPEG, or WEBP.")
    
    # Save the file
    filename = file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # 1. Run the image through the CNN Model
        prediction_type, confidence = predict_acne_type(filepath)
        
        # 2. Check if a User ID was provided to save to MongoDB history
        if userId:
            save_prediction_history(userId, filename, prediction_type, confidence)
        
        return {
            "type": prediction_type,
            "confidence": confidence
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during prediction: {str(e)}")

# Auth Routes
@app.post("/login")
async def login(request: LoginRequest):
    from db.database import get_user_by_email
    user = get_user_by_email(request.email)
    
    # In production, use hashed passwords (e.g., bcrypt)! 
    if user and user.get('password') == request.password:
        return {
            "message": "Login successful",
            "user": {
                "id": str(user['_id']),
                "name": user.get('name', 'User'),
                "email": user['email']
            }
        }
        
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/register")
async def register(request: RegisterRequest):
    from db.database import create_user, get_user_by_email
    
    if get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_id = create_user({
        "email": request.email,
        "password": request.password,  # Again, please hash this in a real setup
        "name": request.name
    })
    
    return {
        "message": "Registration successful",
        "user": {
            "id": user_id,
            "name": request.name,
            "email": request.email
        }
    }

@app.get("/history")
async def history(userId: str):
    from db.database import get_user_history
    
    if not userId:
        raise HTTPException(status_code=400, detail="User ID is required")
        
    user_history = get_user_history(userId)
    return {"history": user_history}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
