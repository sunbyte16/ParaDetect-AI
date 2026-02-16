# ParaDetect AI - Complete Setup Guide

## 🚀 New Features Added

### Authentication & User Management
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ User profiles
- ✅ Role-based access (User/Admin)

### Patient Management
- ✅ Create and manage patients
- ✅ Patient ID tracking
- ✅ Link predictions to patients
- ✅ View patient case history

### Enhanced Analysis
- ✅ Save predictions to database
- ✅ Track all analysis history
- ✅ Filter by date range
- ✅ Patient-linked predictions

### Reporting & Export
- ✅ Export history to CSV
- ✅ Doctor notes (coming soon: PDF reports)
- ✅ Detailed prediction history

### Admin Dashboard
- ✅ View all users
- ✅ Platform statistics
- ✅ Time-based analytics (today/week/month)
- ✅ User management

### Statistics Dashboard
- ✅ Total scans counter
- ✅ Infected vs uninfected counts
- ✅ Patient count
- ✅ Real-time updates

## 📋 Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- pip (Python package manager)
- npm (Node package manager)

## 🔧 Installation

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements-pytorch.txt
```

New dependencies added:
- `sqlalchemy` - Database ORM
- `python-jose[cryptography]` - JWT tokens
- `passlib[bcrypt]` - Password hashing
- `reportlab` - PDF generation
- `pandas` - Data export

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

New dependencies added:
- `react-router-dom` - Routing
- `recharts` - Charts (for future analytics)
- `date-fns` - Date formatting

### Step 3: Initialize Database

The database will be automatically created when you start the enhanced backend for the first time.

## 🚀 Running the Application

### Option 1: Use Enhanced Backend (Recommended)

**Terminal 1 - Start Enhanced Backend:**
```bash
cd backend
python app_enhanced.py
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Use Original Backend (Legacy Mode)

**Terminal 1 - Start Original Backend:**
```bash
START_BACKEND.bat
```

**Terminal 2 - Start Frontend:**
```bash
START_FRONTEND.bat
```

## 🔐 Default Admin Account

When you first start the enhanced backend, a default admin account is created:

- **Email:** admin@paradetect.ai
- **Password:** admin123

⚠️ **Important:** Change this password in production!

## 📱 Application URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## 🗺️ Application Routes

### Public Routes
- `/login` - User login
- `/register` - User registration

### Protected Routes (Requires Authentication)
- `/dashboard` - Main analysis dashboard
- `/history` - View all predictions with filters
- `/admin` - Admin dashboard (admin only)

## 📊 Features Overview

### For Regular Users

1. **Dashboard**
   - Upload blood smear images
   - Create and select patients
   - Get real-time AI predictions
   - View personal statistics

2. **History**
   - View all past predictions
   - Filter by date range
   - Export to CSV
   - See patient-linked results

3. **Patient Management**
   - Create new patients
   - Track patient information
   - Link predictions to patients
   - View patient history

### For Admins

1. **Admin Dashboard**
   - View all users
   - Platform-wide statistics
   - Time-based analytics
   - User role management

2. **All User Features**
   - Admins have access to all regular user features

## 🔄 Switching Between Versions

### To Use Enhanced Version (with all new features):
```bash
cd backend
python app_enhanced.py
```

Then update frontend to use `App_Enhanced.jsx`:
```bash
# In frontend/src/main.jsx, change:
import App from './App_Enhanced'
```

### To Use Original Version (simple prediction only):
```bash
START_BACKEND.bat
```

Keep frontend using original `App.jsx`

## 📁 Project Structure

```
paradetect-ai/
├── backend/
│   ├── app_pytorch.py          # Original backend
│   ├── app_enhanced.py         # Enhanced backend with all features
│   ├── database.py             # Database configuration
│   ├── models.py               # Database models
│   ├── schemas.py              # Pydantic schemas
│   ├── auth.py                 # Authentication logic
│   ├── models/
│   │   └── malaria_model.pth   # Trained model
│   ├── uploads/                # Uploaded images (auto-created)
│   └── paradetect.db           # SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── History.jsx
│   │   │   └── Admin.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── App.jsx             # Original app
│   │   ├── App_Enhanced.jsx    # Enhanced app with routing
│   │   └── main.jsx
│   └── package.json
│
├── IMPLEMENTATION_PLAN.md      # Detailed feature plan
└── SETUP_GUIDE.md             # This file
```

## 🔮 Coming Soon

### Phase 3 Features (In Development)
- [ ] Grad-CAM heatmap visualization
- [ ] PDF report generation
- [ ] Share report links
- [ ] Model comparison
- [ ] Confidence threshold alerts
- [ ] Real-time notifications

### Phase 4 Features (Planned)
- [ ] Model upload/management
- [ ] Model retraining interface
- [ ] Advanced analytics charts
- [ ] Email notifications
- [ ] Multi-language support

## 🐛 Troubleshooting

### Backend Issues

**Error: "Model not found"**
```bash
# Make sure the model file exists
ls backend/models/malaria_model.pth
```

**Error: "Module not found"**
```bash
# Reinstall dependencies
cd backend
pip install -r requirements-pytorch.txt
```

**Database errors**
```bash
# Delete and recreate database
rm backend/paradetect.db
# Restart backend - it will recreate the database
```

### Frontend Issues

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port already in use**
```bash
# Kill process on port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill -9
```

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

**Patients:**
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/{id}/history` - Patient history

**Predictions:**
- `POST /api/predict` - Make prediction (authenticated)
- `GET /api/predictions` - List predictions
- `PUT /api/predictions/{id}/notes` - Add notes

**Stats:**
- `GET /api/stats` - User statistics

**Admin:**
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List all users

## 🔒 Security Notes

1. **Change default admin password** in production
2. **Update SECRET_KEY** in `backend/auth.py`
3. **Use HTTPS** in production
4. **Enable CORS** only for trusted domains
5. **Use PostgreSQL** instead of SQLite in production

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check the IMPLEMENTATION_PLAN.md for feature details

## 🎉 Success!

If everything is set up correctly, you should see:
- ✅ Backend running on port 8000
- ✅ Frontend running on port 5173
- ✅ Login page accessible
- ✅ Admin dashboard accessible with default credentials
- ✅ Predictions being saved to database
- ✅ Statistics updating in real-time

Enjoy using ParaDetect AI! 🔬🎯
