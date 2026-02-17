# ParaDetect AI - Quick Reference Card

## 🚀 Start Commands

```bash
# Start Backend
cd backend
python app.py

# Start Frontend
cd frontend
npm run dev
```

## 🔑 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@test.com | patient123 |
| Doctor | doctor@test.com | doctor123 |
| Admin | admin@paradetect.ai | admin123 |

## 🧠 Train Model

```bash
cd backend
python train_model.py --epochs 10 --batch_size 32
```

## 🧪 Testing

```bash
# View Data
python view_patients.py
python view_predictions.py
python show_database_structure.py

# Export
python export_patients.py

# Test
python test_prediction.py
python test_appointments.py
python complete_test.py

# Database
python migrate_db.py
python fix_predictions_table.py
python create_test_users.py
python reset_password.py <email> <password>
```

## 📊 URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Important Files

- `backend/app.py` - Main application
- `backend/models.py` - Database models
- `backend/paradetect.db` - Database
- `backend/models/malaria_model.pth` - AI model
- `frontend/src/App.jsx` - React app

## 🗂️ Dataset Structure

```
cell_images/
├── Parasitized/
└── Uninfected/
```

## 📚 Documentation

- `README.md` - Main docs
- `FINAL_SETUP_GUIDE.md` - Setup
- `MODEL_TRAINING_GUIDE.md` - Training
- `COMPLETE_FIX_SUMMARY.md` - Fixes
- `PROJECT_STRUCTURE.md` - Structure

## ✅ Status Check

All systems operational:
- ✅ Backend running
- ✅ Frontend running
- ✅ Database working
- ✅ Model loaded
- ✅ Appointments working
- ✅ Image analysis working

---

**Quick Start:** Run `start_backend.bat` and `start_frontend.bat`
