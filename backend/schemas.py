from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "patient"  # Default to patient role
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Patient Schemas
class PatientBase(BaseModel):
    patient_id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Prediction Schemas
class PredictionBase(BaseModel):
    prediction: str
    confidence: float
    prob_parasitized: float
    prob_uninfected: float

class PredictionCreate(PredictionBase):
    patient_id: Optional[int] = None
    image_path: str
    gradcam_path: Optional[str] = None

class Prediction(PredictionBase):
    id: int
    user_id: int
    patient_id: Optional[int]
    image_path: str
    gradcam_path: Optional[str]
    doctor_notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PredictionWithPatient(Prediction):
    patient: Optional[Patient] = None

# Stats Schemas
class Stats(BaseModel):
    total_scans: int
    infected_detected: int
    uninfected_detected: int
    total_users: int
    total_patients: int

# Admin Schemas
class AdminStats(Stats):
    predictions_today: int
    predictions_this_week: int
    predictions_this_month: int

# Appointment Schemas
class AppointmentBase(BaseModel):
    doctor_id: int
    appointment_date: datetime
    reason: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Appointment(AppointmentBase):
    id: int
    patient_id: int
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AppointmentWithDetails(Appointment):
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_email: Optional[str] = None
    doctor_specialization: Optional[str] = None

class DoctorInfo(BaseModel):
    id: int
    full_name: str
    email: str
    specialization: Optional[str]
    
    class Config:
        from_attributes = True

# Phone Verification Schemas
class PhoneVerificationRequest(BaseModel):
    phone: str

class PhoneVerificationVerify(BaseModel):
    phone: str
    otp: str

class PhoneVerificationResponse(BaseModel):
    success: bool
    message: str
    otp: Optional[str] = None  # Only for demo
    expires_in: Optional[int] = None
