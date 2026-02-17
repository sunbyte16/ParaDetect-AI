"""
ParaDetect AI - Professional Backend API
Version: 2.0.0
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import io
import os
from typing import Optional, List
import uuid

# Import local modules
import models as db_models
import schemas
import auth
from database import engine, get_db
from chatbot_gemini import get_gemini_response
from config import settings
from logger import logger
import user_activity
from api_activity import router as activity_router
import phone_verification
import image_validator
from smart_image_validator import SmartImageValidator, validate_blood_cell_image_simple

# Create database tables
db_models.Base.metadata.create_all(bind=engine)

# Create phone verification table
phone_verification.create_phone_verification_table()

# Initialize FastAPI app
app = FastAPI(
    title="ParaDetect AI API",
    version="2.0.0",
    description="Professional AI-powered malaria detection system",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(activity_router)

# Global model variable
model = None
smart_validator = None
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
os.makedirs(f"{settings.UPLOAD_DIR}/images", exist_ok=True)
os.makedirs(f"{settings.UPLOAD_DIR}/gradcam", exist_ok=True)

def load_model():
    """Load the trained PyTorch model"""
    global model, smart_validator, CLASS_NAMES
    model_path = f"{settings.MODEL_DIR}/malaria_model.pth"
    
    try:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        logger.info(f"Loading model from {model_path}...")
        logger.info(f"Using device: {DEVICE}")
        
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
        
        # Initialize smart validator with loaded model
        smart_validator = SmartImageValidator(model=model)
        
        logger.info("✅ Model loaded successfully!")
        logger.info(f"📋 Classes: {CLASS_NAMES}")
        logger.info(f"🖥️  Device: {DEVICE}")
        logger.info("✅ Smart image validator initialized!")
        
    except Exception as e:
        logger.error(f"❌ Model loading error: {e}", exc_info=True)
        raise

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    try:
        logger.info("🚀 Starting ParaDetect AI Backend...")
        
        # Initialize activity tracking tables
        try:
            user_activity.init_activity_tables()
            logger.info("✅ Activity tracking initialized")
        except Exception as e:
            logger.warning(f"⚠️ Activity tracking initialization warning: {e}")
        
        load_model()
        
        # Create default admin user
        db = next(get_db())
        admin = db.query(db_models.User).filter(
            db_models.User.email == settings.DEFAULT_ADMIN_EMAIL
        ).first()
        
        if not admin:
            admin = db_models.User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                hashed_password=auth.get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                full_name=settings.DEFAULT_ADMIN_NAME,
                role="admin"
            )
            db.add(admin)
            db.commit()
            logger.info(f"👤 Default admin created: {settings.DEFAULT_ADMIN_EMAIL}")
        else:
            logger.info("👤 Admin user already exists")
            
        logger.info("✅ Backend startup completed successfully!")
        logger.info(f"🌐 Server running at: http://{settings.HOST}:{settings.PORT}")
        logger.info(f"📚 API docs at: http://{settings.HOST}:{settings.PORT}/docs")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}", exc_info=True)
        logger.warning("⚠️  Server will continue but predictions may not work")

def preprocess_image(image_bytes: bytes):
    """Preprocess image for model prediction"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
        img_tensor = transform(image)
        img_tensor = img_tensor.unsqueeze(0)
        return img_tensor
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

def validate_image_file(file: UploadFile):
    """Validate uploaded image file"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_ext = file.filename.split('.')[-1].lower() if file.filename else ''
    if file_ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_extensions_list)}"
        )
    
    # Additional validation for blood cell images
    logger.info(f"Validating image: {file.filename}")

# ============= BASIC ENDPOINTS =============

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "ParaDetect AI API",
        "version": "2.0.0",
        "description": "Professional AI-powered malaria detection system",
        "features": [
            "AI Malaria Detection",
            "User Authentication",
            "Patient Management",
            "Advanced Analytics",
            "AI Chatbot",
            "Admin Dashboard"
        ],
        "status": "operational",
        "model_loaded": model is not None,
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model is not None else "degraded",
        "model_loaded": model is not None,
        "device": str(DEVICE),
        "classes": CLASS_NAMES if model else None,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    }

# ============= AUTH ENDPOINTS =============

@app.post("/api/auth/register", response_model=schemas.Token)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register new user - Simple registration without phone verification"""
    try:
        # Check if user exists
        db_user = db.query(db_models.User).filter(db_models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate role
        valid_roles = ['patient', 'doctor', 'admin']
        role = user.role if user.role in valid_roles else 'patient'
        
        # Create new user - phone is optional, no verification required
        hashed_password = auth.get_password_hash(user.password)
        db_user = db_models.User(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            role=role,
            phone=user.phone if user.phone else None
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Log signup activity
        try:
            user_activity.log_user_signup(
                user_id=db_user.id,
                email=db_user.email,
                full_name=db_user.full_name
            )
            user_activity.log_user_activity(
                user_id=db_user.id,
                email=db_user.email,
                activity_type="signup",
                activity_description=f"User registered successfully as {role}"
            )
        except Exception as e:
            logger.warning(f"Failed to log signup activity: {e}")
        
        # Generate token
        access_token = auth.create_access_token(data={"sub": user.email})
        
        # Create session
        try:
            user_activity.create_user_session(
                user_id=db_user.id,
                email=db_user.email,
                session_token=access_token
            )
        except Exception as e:
            logger.warning(f"Failed to create session: {e}")
        
        logger.info(f"New user registered: {user.email} as {role}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/auth/send-otp", response_model=schemas.PhoneVerificationResponse)
async def send_otp(request: schemas.PhoneVerificationRequest):
    """Send OTP to phone number for verification"""
    try:
        result = phone_verification.send_otp(request.phone)
        return result
    except Exception as e:
        logger.error(f"Error sending OTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@app.post("/api/auth/verify-otp", response_model=schemas.PhoneVerificationResponse)
async def verify_otp(request: schemas.PhoneVerificationVerify):
    """Verify OTP for phone number"""
    try:
        result = phone_verification.verify_otp(request.phone, request.otp)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")

@app.post("/api/auth/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user"""
    try:
        user = db.query(db_models.User).filter(db_models.User.email == form_data.username).first()
        
        if not user or not auth.verify_password(form_data.password, user.hashed_password):
            # Log failed login attempt
            try:
                user_activity.log_failed_login(
                    email=form_data.username,
                    reason="Invalid credentials"
                )
            except Exception as e:
                logger.warning(f"Failed to log failed login: {e}")
            
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        # Generate token
        access_token = auth.create_access_token(data={"sub": user.email})
        
        # Log successful login
        try:
            user_activity.log_user_login(
                user_id=user.id,
                email=user.email
            )
            user_activity.log_user_activity(
                user_id=user.id,
                email=user.email,
                activity_type="login",
                activity_description="User logged in successfully"
            )
        except Exception as e:
            logger.warning(f"Failed to log login activity: {e}")
        
        # Create session
        try:
            user_activity.create_user_session(
                user_id=user.id,
                email=user.email,
                session_token=access_token
            )
        except Exception as e:
            logger.warning(f"Failed to create session: {e}")
        
        logger.info(f"User logged in: {user.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Login failed")

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
    try:
        # Check if patient_id already exists
        existing = db.query(db_models.Patient).filter(
            db_models.Patient.patient_id == patient.patient_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Patient ID already exists")
        
        db_patient = db_models.Patient(**patient.dict(), user_id=current_user.id)
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        
        logger.info(f"New patient created: {patient.patient_id} by {current_user.email}")
        
        return db_patient
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Patient creation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create patient")

@app.get("/api/patients", response_model=List[schemas.Patient])
async def get_patients(
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all patients for current user"""
    return db.query(db_models.Patient).filter(
        db_models.Patient.user_id == current_user.id
    ).all()

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
    """Public prediction endpoint (no auth required)"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    validate_image_file(file)
    
    try:
        image_bytes = await file.read()
        
        # Check file size
        if len(image_bytes) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Smart validation - check if image is blood cell related
        if smart_validator:
            smart_validator.validate_blood_cell_image(image_bytes, file.filename)
        else:
            # Fallback to simple validation
            validate_blood_cell_image_simple(image_bytes, file.filename)
        
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
        
        logger.info(f"Public prediction: {predicted_class} ({confidence_value:.2%})")
        
        return JSONResponse(content=response)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Authenticated prediction with patient linking"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    validate_image_file(file)
    
    try:
        # Save uploaded image
        image_bytes = await file.read()
        
        # Check file size
        if len(image_bytes) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Smart validation - check if image is blood cell related
        if smart_validator:
            smart_validator.validate_blood_cell_image(image_bytes, file.filename)
        else:
            # Fallback to simple validation
            validate_blood_cell_image_simple(image_bytes, file.filename)
        
        image_filename = f"{uuid.uuid4()}_{file.filename}"
        image_path = f"{settings.UPLOAD_DIR}/images/{image_filename}"
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
        
        logger.info(f"Prediction saved: {predicted_class} ({confidence_value:.2%}) by {current_user.email}")
        
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
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

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
    query = db.query(db_models.Prediction).filter(
        db_models.Prediction.user_id == current_user.id
    )
    
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
    
    logger.info(f"Notes updated for prediction {prediction_id} by {current_user.email}")
    
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
    infected = db.query(db_models.Prediction).filter(
        db_models.Prediction.prediction == "Parasitized"
    ).count()
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

@app.put("/api/admin/users/{user_id}")
async def update_user(
    user_id: int,
    full_name: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    current_user: db_models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    """Update user (admin only)"""
    user = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if full_name is not None:
        user.full_name = full_name
    if role is not None:
        if role not in ['patient', 'doctor', 'admin']:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    
    db.commit()
    db.refresh(user)
    
    logger.info(f"User {user_id} updated by admin {current_user.email}")
    
    return {"message": "User updated successfully", "user": user}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: db_models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    logger.info(f"User {user_id} deleted by admin {current_user.email}")
    
    return {"message": "User deleted successfully"}

@app.get("/api/admin/appointments")
async def get_all_appointments(
    current_user: db_models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all appointments (admin only)"""
    
    appointments = db.query(db_models.Appointment).order_by(
        db_models.Appointment.appointment_date.desc()
    ).all()
    
    # Enrich with user details
    result = []
    for apt in appointments:
        patient = db.query(db_models.User).filter(db_models.User.id == apt.patient_id).first()
        doctor = db.query(db_models.User).filter(db_models.User.id == apt.doctor_id).first()
        
        apt_dict = {
            "id": apt.id,
            "patient_id": apt.patient_id,
            "doctor_id": apt.doctor_id,
            "appointment_date": apt.appointment_date,
            "reason": apt.reason,
            "status": apt.status,
            "notes": apt.notes,
            "created_at": apt.created_at,
            "updated_at": apt.updated_at,
            "patient_name": patient.full_name if patient else None,
            "patient_email": patient.email if patient else None,
            "doctor_name": doctor.full_name if doctor else None,
            "doctor_email": doctor.email if doctor else None,
            "doctor_specialization": doctor.specialization if doctor else None
        }
        result.append(apt_dict)
    
    return result

@app.get("/api/admin/predictions")
async def get_all_predictions(
    current_user: db_models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all predictions (admin only)"""
    return db.query(db_models.Prediction).order_by(db_models.Prediction.created_at.desc()).all()

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
        
        logger.info(f"Chatbot query by {current_user.email}: {message[:50]}...")
        
        return {
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Chatbot error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

@app.post("/api/chatbot/public")
async def chat_with_ai_public(message: str = Form(...)):
    """Public AI Chatbot endpoint - no authentication required, powered by Google Gemini AI"""
    try:
        response = get_gemini_response(message, None)
        
        logger.info(f"Public chatbot query: {message[:50]}...")
        
        return {
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Chatbot error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

# ============= APPOINTMENT ENDPOINTS =============

@app.get("/api/doctors", response_model=List[schemas.DoctorInfo])
async def get_doctors(db: Session = Depends(get_db)):
    """Get all doctors for appointment booking"""
    doctors = db.query(db_models.User).filter(
        db_models.User.role == "doctor",
        db_models.User.is_active == True
    ).all()
    return doctors

@app.post("/api/appointments", response_model=schemas.Appointment)
async def create_appointment(
    appointment: schemas.AppointmentCreate,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create new appointment (patient books with doctor)"""
    try:
        # Verify doctor exists and is active
        doctor = db.query(db_models.User).filter(
            db_models.User.id == appointment.doctor_id,
            db_models.User.role == "doctor",
            db_models.User.is_active == True
        ).first()
        
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found or inactive")
        
        # Check if appointment time is in the future
        # Remove timezone info for comparison
        appointment_date_naive = appointment.appointment_date.replace(tzinfo=None) if appointment.appointment_date.tzinfo else appointment.appointment_date
        if appointment_date_naive <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Appointment date must be in the future")
        
        # Create appointment
        # Using db_models.Appointment
        db_appointment = db_models.Appointment(
            patient_id=current_user.id,
            doctor_id=appointment.doctor_id,
            appointment_date=appointment_date_naive,
            reason=appointment.reason,
            status="scheduled"
        )
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        logger.info(f"Appointment created: Patient {current_user.email} with Doctor {doctor.email}")
        
        return db_appointment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Appointment creation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create appointment: {str(e)}")

@app.get("/api/appointments", response_model=List[schemas.AppointmentWithDetails])
async def get_appointments(
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all appointments for current user (patient or doctor)"""
    try:
        if current_user.role == "doctor":
            appointments = db.query(db_models.Appointment).filter(
                db_models.Appointment.doctor_id == current_user.id
            ).order_by(db_models.Appointment.appointment_date.desc()).all()
        else:
            appointments = db.query(db_models.Appointment).filter(
                db_models.Appointment.patient_id == current_user.id
            ).order_by(db_models.Appointment.appointment_date.desc()).all()
        
        # Enrich with user details
        result = []
        for apt in appointments:
            patient = db.query(db_models.User).filter(db_models.User.id == apt.patient_id).first()
            doctor = db.query(db_models.User).filter(db_models.User.id == apt.doctor_id).first()
            
            apt_dict = {
                "id": apt.id,
                "patient_id": apt.patient_id,
                "doctor_id": apt.doctor_id,
                "appointment_date": apt.appointment_date,
                "reason": apt.reason,
                "status": apt.status,
                "notes": apt.notes,
                "created_at": apt.created_at,
                "updated_at": apt.updated_at,
                "patient_name": patient.full_name if patient else None,
                "patient_email": patient.email if patient else None,
                "doctor_name": doctor.full_name if doctor else None,
                "doctor_email": doctor.email if doctor else None,
                "doctor_specialization": doctor.specialization if doctor else None
            }
            result.append(apt_dict)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching appointments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch appointments: {str(e)}")

@app.get("/api/appointments/{appointment_id}", response_model=schemas.AppointmentWithDetails)
async def get_appointment(
    appointment_id: int,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific appointment details"""
    
    appointment = db.query(db_models.Appointment).filter(
        db_models.Appointment.id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check authorization
    if current_user.role not in ["admin"] and \
       appointment.patient_id != current_user.id and \
       appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
    
    patient = db.query(db_models.User).filter(db_models.User.id == appointment.patient_id).first()
    doctor = db.query(db_models.User).filter(db_models.User.id == appointment.doctor_id).first()
    
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "appointment_date": appointment.appointment_date,
        "reason": appointment.reason,
        "status": appointment.status,
        "notes": appointment.notes,
        "created_at": appointment.created_at,
        "updated_at": appointment.updated_at,
        "patient_name": patient.full_name if patient else None,
        "patient_email": patient.email if patient else None,
        "doctor_name": doctor.full_name if doctor else None,
        "doctor_email": doctor.email if doctor else None,
        "doctor_specialization": doctor.specialization if doctor else None
    }

@app.put("/api/appointments/{appointment_id}", response_model=schemas.Appointment)
async def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update appointment (reschedule, cancel, add notes)"""
    
    appointment = db.query(db_models.Appointment).filter(
        db_models.Appointment.id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check authorization
    if current_user.role not in ["admin"] and \
       appointment.patient_id != current_user.id and \
       appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this appointment")
    
    # Update fields
    if appointment_update.appointment_date:
        if appointment_update.appointment_date <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Appointment date must be in the future")
        appointment.appointment_date = appointment_update.appointment_date
    
    if appointment_update.reason is not None:
        appointment.reason = appointment_update.reason
    
    if appointment_update.status:
        if appointment_update.status not in ["scheduled", "completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        appointment.status = appointment_update.status
    
    if appointment_update.notes is not None:
        appointment.notes = appointment_update.notes
    
    appointment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(appointment)
    
    logger.info(f"Appointment {appointment_id} updated by {current_user.email}")
    
    return appointment

@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete/cancel appointment"""
    
    appointment = db.query(db_models.Appointment).filter(
        db_models.Appointment.id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check authorization (only patient or admin can delete)
    if current_user.role not in ["admin"] and appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this appointment")
    
    db.delete(appointment)
    db.commit()
    
    logger.info(f"Appointment {appointment_id} deleted by {current_user.email}")
    
    return {"message": "Appointment deleted successfully"}

# ============= DOCTOR-SPECIFIC ENDPOINTS =============

@app.get("/api/patients/{patient_id}")
async def get_patient_details(
    patient_id: int,
    current_user: db_models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed patient information"""
    patient = db.query(db_models.Patient).filter(db_models.Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role not in ["admin", "doctor"] and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient")
    
    return patient

# ============= RUN SERVER =============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        log_level="info"
    )
