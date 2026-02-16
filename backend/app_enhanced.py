from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import io
import os
import shutil
from typing import Optional, List
import uuid

import models as db_models
import schemas
import auth
from database import engine, get_db
from chatbot_gemini import get_gemini_response

# Create database tables
db_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ParaDetect AI API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None
CLASS_NAMES = ["Parasitized", "Uninfected"]
IMG_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Create upload directories
os.makedirs("uploads/images", exist_ok=True)
os.makedirs("uploads/gradcam", exist_ok=True)

def load_model():
    """Load the trained model"""
    global model, CLASS_NAMES
    model_path = "models/malaria_model.pth"
    
    try:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        print(f"Loading model from {model_path}...")
        print(f"Using device: {DEVICE}")
        
        model = models.mobilenet_v2(pretrained=False)
        model.classifier = torch.nn.Sequential(
            torch.nn.Dropout(0.2),
            torch.nn.Linear(model.last_channel, 2)
        )
        
        checkpoint = torch.load(model_path, map_location=DEVICE)
        
        if 'model_state_dict' not in checkpoint:
            raise KeyError("Model checkpoint missing 'model_state_dict'")
        if 'class_names' not in checkpoint:
            raise KeyError("Model checkpoint missing 'class_names'")
            
        model.load_state_dict(checkpoint['model_state_dict'])
        CLASS_NAMES = checkpoint['class_names']
        
        model = model.to(DEVICE)
        model.eval()
        
        print(f"✅ Model loaded successfully!")
        print(f"📋 Classes: {CLASS_NAMES}")
        print(f"🖥️  Device: {DEVICE}")
        
    except FileNotFoundError as e:
        print(f"❌ Model file error: {e}")
        print("Please ensure the model file exists at backend/models/malaria_model.pth")
        raise
    except Exception as e:
        print(f"❌ Model loading error: {e}")
        print("Please check if the model file is valid and compatible")
        raise

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    try:
        print("🚀 Starting ParaDetect AI Backend...")
        load_model()
        
        # Create default admin user
        db = next(get_db())
        admin = db.query(db_models.User).filter(db_models.User.email == "admin@paradetect.ai").first()
        if not admin:
            admin = db_models.User(
                email="admin@paradetect.ai",
                hashed_password=auth.get_password_hash("admin123"),
                full_name="Admin User",
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("👤 Default admin created: admin@paradetect.ai / admin123")
        else:
            print("👤 Admin user already exists")
            
        print("✅ Backend startup completed successfully!")
        print("🌐 Server running at: http://localhost:8000")
        print("📚 API docs at: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        print("⚠️  Server will continue but predictions may not work")
        print("Please check the model file and dependencies")

def preprocess_image(image_bytes: bytes):
    """Preprocess image for model prediction"""
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
    img_tensor = transform(image)
    img_tensor = img_tensor.unsqueeze(0)
    return img_tensor

# ============= AUTH ENDPOINTS =============

@app.post("/api/auth/register", response_model=schemas.Token)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    db_user = db.query(db_models.User).filter(db_models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = db_models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@app.post("/api/auth/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(db_models.User).filter(db_models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.User)
async def get_me(current_user: db_models.User = Depends(auth.get_current_user)):
    """Get current user"""
    return current_user

# ============= PATIENT ENDPOINTS =============

@app.post("/api/patients", response_model=schemas.Patient)
async def create_patient(
    patient: schemas.PatientCreate,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create new patient"""
    db_patient = db_models.Patient(**patient.dict(), user_id=current_user.id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/api/patients", response_model=List[schemas.Patient])
async def get_patients(
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all patients for current user"""
    return db.query(db_models.Patient).filter(db_models.Patient.user_id == current_user.id).all()

@app.get("/api/patients/{patient_id}/history", response_model=List[schemas.Prediction])
async def get_patient_history(
    patient_id: int,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient case history"""
    return db.query(db_models.Prediction).filter(
        db_models.Prediction.patient_id == patient_id,
        db_models.Prediction.user_id == current_user.id
    ).order_by(db_models.Prediction.created_at.desc()).all()

# ============= PREDICTION ENDPOINTS =============

@app.post("/predict")
async def predict_public(file: UploadFile = File(...)):
    """Public prediction endpoint (no auth required) - for simple frontend"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_bytes = await file.read()
        img_tensor = preprocess_image(image_bytes)
        img_tensor = img_tensor.to(DEVICE)
        
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
            
            predicted_class = CLASS_NAMES[predicted_idx.item()]
            confidence_value = confidence.item()
            probs = probabilities[0].cpu().numpy()
        
        response = {
            "prediction": predicted_class,
            "confidence": round(float(confidence_value), 4),
            "probabilities": {
                CLASS_NAMES[0]: round(float(probs[0]), 4),
                CLASS_NAMES[1]: round(float(probs[1]), 4)
            },
            "filename": file.filename
        }
        
        return JSONResponse(content=response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Predict malaria from blood smear image"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save uploaded image
        image_bytes = await file.read()
        image_filename = f"{uuid.uuid4()}_{file.filename}"
        image_path = f"uploads/images/{image_filename}"
        with open(image_path, "wb") as f:
            f.write(image_bytes)
        
        # Preprocess and predict
        img_tensor = preprocess_image(image_bytes)
        img_tensor = img_tensor.to(DEVICE)
        
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
            
            predicted_class = CLASS_NAMES[predicted_idx.item()]
            confidence_value = confidence.item()
            probs = probabilities[0].cpu().numpy()
        
        # Save prediction to database
        db_prediction = db_models.Prediction(
            user_id=current_user.id,
            patient_id=patient_id,
            image_path=image_path,
            prediction=predicted_class,
            confidence=float(confidence_value),
            prob_parasitized=float(probs[0]),
            prob_uninfected=float(probs[1])
        )
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        response = {
            "id": db_prediction.id,
            "prediction": predicted_class,
            "confidence": round(float(confidence_value), 4),
            "probabilities": {
                CLASS_NAMES[0]: round(float(probs[0]), 4),
                CLASS_NAMES[1]: round(float(probs[1]), 4)
            },
            "filename": file.filename,
            "created_at": db_prediction.created_at.isoformat()
        }
        
        return JSONResponse(content=response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/api/predictions", response_model=List[schemas.PredictionWithPatient])
async def get_predictions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all predictions for current user with optional date filter"""
    query = db.query(db_models.Prediction).filter(db_models.Prediction.user_id == current_user.id)
    
    if start_date:
        query = query.filter(db_models.Prediction.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(db_models.Prediction.created_at <= datetime.fromisoformat(end_date))
    
    return query.order_by(db_models.Prediction.created_at.desc()).offset(skip).limit(limit).all()

@app.put("/api/predictions/{prediction_id}/notes")
async def update_notes(
    prediction_id: int,
    notes: str = Form(...),
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Add doctor notes to prediction"""
    prediction = db.query(db_models.Prediction).filter(
        db_models.Prediction.id == prediction_id,
        db_models.Prediction.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    prediction.doctor_notes = notes
    db.commit()
    return {"message": "Notes updated successfully"}

# ============= STATS ENDPOINTS =============

@app.get("/api/stats", response_model=schemas.Stats)
async def get_stats(
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    total_scans = db.query(db_models.Prediction).filter(
        db_models.Prediction.user_id == current_user.id
    ).count()
    
    infected = db.query(db_models.Prediction).filter(
        db_models.Prediction.user_id == current_user.id,
        db_models.Prediction.prediction == "Parasitized"
    ).count()
    
    uninfected = total_scans - infected
    
    total_patients = db.query(db_models.Patient).filter(
        db_models.Patient.user_id == current_user.id
    ).count()
    
    return {
        "total_scans": total_scans,
        "infected_detected": infected,
        "uninfected_detected": uninfected,
        "total_users": 1,
        "total_patients": total_patients
    }

# ============= ADMIN ENDPOINTS =============

@app.get("/api/admin/stats", response_model=schemas.AdminStats)
async def get_admin_stats(
    current_user: db_models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    """Get platform statistics (admin only)"""
    total_scans = db.query(db_models.Prediction).count()
    infected = db.query(db_models.Prediction).filter(db_models.Prediction.prediction == "Parasitized").count()
    total_users = db.query(db_models.User).count()
    total_patients = db.query(db_models.Patient).count()
    
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    predictions_today = db.query(db_models.Prediction).filter(
        db_models.Prediction.created_at >= datetime.combine(today, datetime.min.time())
    ).count()
    
    predictions_week = db.query(db_models.Prediction).filter(
        db_models.Prediction.created_at >= datetime.combine(week_ago, datetime.min.time())
    ).count()
    
    predictions_month = db.query(db_models.Prediction).filter(
        db_models.Prediction.created_at >= datetime.combine(month_ago, datetime.min.time())
    ).count()
    
    return {
        "total_scans": total_scans,
        "infected_detected": infected,
        "uninfected_detected": total_scans - infected,
        "total_users": total_users,
        "total_patients": total_patients,
        "predictions_today": predictions_today,
        "predictions_this_week": predictions_week,
        "predictions_this_month": predictions_month
    }

@app.get("/api/admin/users", response_model=List[schemas.User])
async def get_all_users(
    current_user: db_models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    return db.query(db_models.User).all()

# ============= CHATBOT ENDPOINTS =============

@app.post("/api/chatbot")
async def chat_with_ai(
    message: str = Form(...),
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """AI Chatbot endpoint - provides medical advice and support using Google Gemini AI"""
    try:
        # Get user's most recent prediction for context
        recent_prediction = db.query(db_models.Prediction).filter(
            db_models.Prediction.user_id == current_user.id
        ).order_by(db_models.Prediction.created_at.desc()).first()
        
        user_context = None
        if recent_prediction:
            user_context = {
                'prediction': recent_prediction.prediction,
                'confidence': recent_prediction.confidence,
                'created_at': recent_prediction.created_at
            }
        
        # Get AI response from Gemini
        response = get_gemini_response(message, user_context)
        
        return {
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

@app.post("/api/chatbot/public")
async def chat_with_ai_public(message: str = Form(...)):
    """Public AI Chatbot endpoint - no authentication required, powered by Google Gemini AI"""
    try:
        response = get_gemini_response(message, None)
        return {
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

# ============= BASIC ENDPOINTS =============

@app.get("/")
async def root():
    """Root endpoint with basic info"""
    return {
        "message": "ParaDetect AI API v2.0",
        "version": "2.0.0",
        "features": ["Authentication", "Patient Management", "Advanced Analytics", "Admin Dashboard"],
        "model_loaded": model is not None,
        "health_check": "/health",
        "api_docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(DEVICE),
        "class_names": CLASS_NAMES if model else None,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============= PUBLIC PREDICTION ENDPOINT =============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(DEVICE),
        "class_names": CLASS_NAMES if model else None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    model_loaded = model is not None
    return {
        "status": "healthy" if model_loaded else "model_not_loaded",
        "model_loaded": model_loaded,
        "device": str(DEVICE)
    }

@app.post("/predict")
async def predict_legacy(file: UploadFile = File(...)):
    """Legacy prediction endpoint (no auth required)"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_bytes = await file.read()
        img_tensor = preprocess_image(image_bytes)
        img_tensor = img_tensor.to(DEVICE)
        
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
            
            predicted_class = CLASS_NAMES[predicted_idx.item()]
            confidence_value = confidence.item()
            probs = probabilities[0].cpu().numpy()
        
        response = {
            "prediction": predicted_class,
            "confidence": round(float(confidence_value), 4),
            "probabilities": {
                CLASS_NAMES[0]: round(float(probs[0]), 4),
                CLASS_NAMES[1]: round(float(probs[1]), 4)
            },
            "filename": file.filename
        }
        
        return JSONResponse(content=response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
