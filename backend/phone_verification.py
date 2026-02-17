"""
Phone verification system for patient registration
"""
import random
import string
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from database import Base, SessionLocal
from logger import logger

class PhoneVerification(Base):
    """Phone verification OTP storage"""
    __tablename__ = "phone_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, nullable=False, index=True)
    otp = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

def generate_otp(length=6):
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))

def send_otp(phone: str) -> dict:
    """
    Send OTP to phone number
    In production, integrate with SMS service like Twilio
    For now, we'll just store it in database
    """
    db = SessionLocal()
    try:
        # Generate OTP
        otp = generate_otp()
        
        # Set expiration (5 minutes)
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        
        # Delete old OTPs for this phone
        db.query(PhoneVerification).filter(
            PhoneVerification.phone == phone,
            PhoneVerification.is_verified == False
        ).delete()
        
        # Create new verification
        verification = PhoneVerification(
            phone=phone,
            otp=otp,
            expires_at=expires_at
        )
        db.add(verification)
        db.commit()
        
        logger.info(f"OTP generated for {phone}: {otp}")
        
        # In production, send SMS here
        # For demo, return OTP in response
        return {
            "success": True,
            "message": "OTP sent successfully",
            "otp": otp,  # Remove this in production!
            "expires_in": 300  # 5 minutes
        }
    except Exception as e:
        logger.error(f"Error sending OTP: {e}")
        db.rollback()
        return {
            "success": False,
            "message": "Failed to send OTP"
        }
    finally:
        db.close()

def verify_otp(phone: str, otp: str) -> dict:
    """Verify OTP for phone number"""
    db = SessionLocal()
    try:
        # Find verification
        verification = db.query(PhoneVerification).filter(
            PhoneVerification.phone == phone,
            PhoneVerification.otp == otp,
            PhoneVerification.is_verified == False,
            PhoneVerification.expires_at > datetime.utcnow()
        ).first()
        
        if not verification:
            return {
                "success": False,
                "message": "Invalid or expired OTP"
            }
        
        # Mark as verified
        verification.is_verified = True
        db.commit()
        
        logger.info(f"Phone verified: {phone}")
        
        return {
            "success": True,
            "message": "Phone verified successfully"
        }
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}")
        db.rollback()
        return {
            "success": False,
            "message": "Verification failed"
        }
    finally:
        db.close()

def is_phone_verified(phone: str) -> bool:
    """Check if phone is verified"""
    db = SessionLocal()
    try:
        verification = db.query(PhoneVerification).filter(
            PhoneVerification.phone == phone,
            PhoneVerification.is_verified == True
        ).first()
        return verification is not None
    finally:
        db.close()

def create_phone_verification_table():
    """Create phone verification table"""
    from database import engine
    Base.metadata.create_all(bind=engine, tables=[PhoneVerification.__table__])
    logger.info("Phone verification table created")
