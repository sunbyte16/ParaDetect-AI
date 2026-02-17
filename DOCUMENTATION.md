# 📚 ParaDetect AI - Complete Documentation

## Table of Contents
1. [Current Status](#current-status)
2. [Features](#features)
3. [Authentication](#authentication)
4. [Smart Image Validation](#smart-image-validation)
5. [Appointment System](#appointment-system)
6. [AI Chatbot](#ai-chatbot)
7. [Role Selection](#role-selection)
8. [Troubleshooting](#troubleshooting)

---

## Current Status

### ✅ Working Features
- User authentication (Patient, Doctor, Admin)
- Image analysis with smart validation
- Appointment booking and management
- AI chatbot (fallback mode)
- PDF report generation
- Dashboard with statistics
- Role-based access control

### 🚀 Running Services
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 📊 Database
- **Type**: SQLite3
- **Location**: `backend/paradetect.db`
- **Tables**: users, patients, predictions, appointments, user_activity

---

## Features

### 1. User Roles

#### Patient
- Upload and analyze blood cell images
- View test results and history
- Book appointments with doctors
- Download PDF reports
- Access AI chatbot

#### Doctor
- Review patient cases
- View all appointments
- Add notes to predictions
- Manage patient records

#### Admin
- Full system access
- User management
- View all appointments and predictions
- Platform statistics

### 2. Image Analysis

**Upload Process:**
1. Select blood cell microscopy image
2. System validates image (smart validation)
3. AI analyzes image
4. Results displayed with confidence scores
5. Option to download PDF report

**Smart Validation:**
- Rejects non-blood cell images
- Checks format, size, brightness, variance
- AI-based similarity check
- Clear error messages

**Results Include:**
- Prediction (Parasitized/Uninfected)
- Confidence score
- Probability breakdown
- Timestamp
- PDF report option

### 3. Appointment System

**Patient Actions:**
- Book appointments with doctors
- View appointment history
- Cancel appointments
- See appointment status

**Doctor Actions:**
- View all appointments
- Update appointment status
- Add notes to appointments
- Manage schedule

**Appointment Status:**
- Scheduled
- Completed
- Cancelled

### 4. AI Chatbot

**Capabilities:**
- Medical advice and support
- Health questions
- General knowledge
- Technology help
- Food and nutrition
- Travel information

**Current Status:**
- Using fallback mode (API quota exceeded)
- Still provides helpful responses
- Context-aware for medical questions

**To Enable Full AI:**
- Get new Google Gemini API key
- Update `backend/.env`
- Restart backend

---

## Authentication

### Registration
1. Go to http://localhost:5173/register
2. Select role (Patient/Doctor/Admin)
3. Fill in details:
   - Full Name
   - Email
   - Phone (optional)
   - Password
4. Agree to terms
5. Click "Create Account"

### Login
1. Go to http://localhost:5173/login
2. Select role
3. Enter email and password
4. Click "Sign In"

### Token Management
- JWT tokens valid for 30 days
- Stored in localStorage
- Automatically included in API requests
- Auto-logout on expiration

### Common Issues

**"Could not validate credentials"**
- Solution: Logout and login again
- Clear browser cache if needed
- Check if token exists in localStorage

**Session expired**
- Solution: Login again to get fresh token
- Tokens expire after 30 days

---

## Smart Image Validation

### What It Does
Validates uploaded images to ensure they're blood cell microscopy images.

### Validation Checks

1. **Format Check**
   - Only PNG and JPEG accepted
   - Error: "Invalid format"

2. **Size Check**
   - Minimum: 50x50 pixels
   - Maximum: 5000x5000 pixels
   - Error: "Image too small/large"

3. **Brightness Check**
   - Range: 20-240 mean intensity
   - Error: "Image too dark/bright"

4. **Variance Check**
   - Minimum: 200 for detail
   - Error: "Image lacks detail"

5. **Color Distribution**
   - Checks for proper color variation
   - Error: "Image lacks color variation"

6. **Edge Density**
   - Validates texture patterns
   - Error: "Image too simple"

7. **AI-Based Check**
   - Uses trained model
   - Checks similarity to training data
   - Error: "Not a blood cell image"

### Accepted Images
- Blood cell microscopy images
- Images from cell_images dataset
- Proper medical microscopy images

### Rejected Images
- Screenshots
- Graphics and logos
- Random photos
- Non-microscopy images

---

## Appointment System

### Booking Appointment

**Patient Side:**
1. Login as patient
2. Go to "Appointments" tab
3. Click "Book New Appointment"
4. Select doctor
5. Choose date and time
6. Enter reason
7. Submit

**Backend Process:**
1. Validates doctor exists
2. Checks date is in future
3. Creates appointment record
4. Returns confirmation

### Viewing Appointments

**Patient View:**
- See own appointments
- Filter by status
- View doctor details

**Doctor View:**
- See all appointments
- View patient details
- Update status
- Add notes

**Admin View:**
- See all appointments
- Full management access

### Appointment Status

- **Scheduled**: Appointment booked
- **Completed**: Appointment finished
- **Cancelled**: Appointment cancelled

### Common Issues

**"Failed to load data"**
- Solution: Check authentication
- Refresh page
- Logout and login again

**Can't book appointment**
- Check date is in future
- Verify doctor is active
- Check authentication

---

## AI Chatbot

### Current Status
⚠️ **Fallback Mode** - API quota exceeded

### Capabilities (Fallback Mode)

**Working Topics:**
- Greetings and conversation
- Technology & programming
- Science & education
- Food & cooking
- Travel & geography
- Basic medical information
- General knowledge

**Example Responses:**
- "Hello" → Friendly greeting
- "What is Python?" → Technology help
- "How to cook pasta?" → Food guidance
- "Tell me about Paris" → Travel info

### Enabling Full AI

**Get New API Key:**
1. Visit https://aistudio.google.com/app/apikey
2. Create new API key
3. Update `backend/.env`:
   ```
   GOOGLE_API_KEY=your-new-key
   ```
4. Restart backend

**Check Current Key:**
- Visit Google AI Studio
- Verify key is active
- Check quota remaining

### Using Chatbot

**In Application:**
1. Login to any account
2. Click "Ask AI Assistant" button
3. Type your question
4. Get instant response

**API Endpoint:**
```bash
POST /api/chatbot/public
Body: { "message": "your question" }
```

---

## Role Selection

### Registration
Users can select role during registration:
- **Patient** (default)
- **Doctor**
- **Admin**

### Login
Users select role before logging in:
- Visual selection with icons
- Description for each role
- Default: Patient

### Role Descriptions

**Patient:**
- Access patient dashboard
- View test results
- Book appointments

**Doctor:**
- Access doctor panel
- Review patient cases
- Manage appointments

**Admin:**
- Full system access
- User management
- Platform statistics

---

## Troubleshooting

### Authentication Issues

**Problem**: "Could not validate credentials"
**Solution**:
1. Logout
2. Clear browser cache
3. Login again
4. Try operation again

**Problem**: Session expired
**Solution**:
1. Login again
2. Token refreshed automatically

### Image Analysis Issues

**Problem**: Image rejected
**Solution**:
1. Use blood cell microscopy image
2. Check image format (PNG/JPEG)
3. Verify image size (50x50 to 5000x5000)
4. Use images from dataset

**Problem**: Analysis fails
**Solution**:
1. Check authentication
2. Verify image is valid
3. Check backend is running
4. Review browser console

### Appointment Issues

**Problem**: Can't book appointment
**Solution**:
1. Check date is in future
2. Verify doctor is active
3. Check authentication
4. Refresh page

**Problem**: Appointments not showing
**Solution**:
1. Refresh page
2. Check authentication
3. Verify role (patient/doctor)
4. Check backend logs

### Chatbot Issues

**Problem**: Chatbot not responding
**Solution**:
1. Check API key in .env
2. Verify backend is running
3. Check browser console
4. Fallback mode still works

**Problem**: Generic responses
**Solution**:
1. API key quota exceeded
2. Get new API key
3. Update .env
4. Restart backend

### General Issues

**Problem**: Frontend not loading
**Solution**:
```bash
cd frontend
npm install
npm run dev
```

**Problem**: Backend errors
**Solution**:
```bash
cd backend
pip install -r requirements-pytorch.txt
python app.py
```

**Problem**: Database errors
**Solution**:
1. Check paradetect.db exists
2. Verify file permissions
3. Restart backend

---

## Quick Commands

### Start Backend
```bash
cd backend
python app.py
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Train Model
```bash
cd backend
python train_improved_model.py --epochs 15
```

### Access Application
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Test Accounts
- Patient: patient@test.com / patient123
- Doctor: doctor@test.com / doctor123
- Admin: admin@paradetect.ai / admin123

---

## Summary

ParaDetect AI is a fully functional malaria detection system with:
- ✅ Smart image validation
- ✅ AI-powered analysis
- ✅ Role-based access
- ✅ Appointment system
- ✅ AI chatbot (fallback mode)
- ✅ PDF reports
- ✅ User management

All features are working and ready to use!
