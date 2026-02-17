# 🔬 ParaDetect AI - Malaria Detection System

AI-powered malaria detection system using deep learning for blood cell analysis.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ParaDetect-AI
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements-pytorch.txt
python app.py
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 👥 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@test.com | patient123 |
| Doctor | doctor@test.com | doctor123 |
| Admin | admin@paradetect.ai | admin123 |

---

## ✨ Features

### 🔬 AI-Powered Analysis
- Upload blood cell microscopy images
- Instant malaria detection (Parasitized/Uninfected)
- Confidence scores and probability breakdown
- Smart image validation (rejects non-blood cell images)

### 👤 User Roles
- **Patient**: Upload images, view results, book appointments
- **Doctor**: Review patient cases, manage appointments
- **Admin**: Full system access, user management

### 📊 Dashboard
- Real-time statistics
- Test history and results
- Appointment management
- PDF report generation

### 🤖 AI Chatbot
- Medical advice and support
- Answers health questions
- Context-aware responses
- Powered by Google Gemini AI

### 📅 Appointment System
- Book appointments with doctors
- View appointment history
- Status tracking (scheduled/completed/cancelled)

### 🔒 Security
- JWT authentication
- Role-based access control
- Secure password hashing
- Session management

---

## 📁 Project Structure

```
ParaDetect-AI/
├── backend/
│   ├── app.py                      # Main FastAPI application
│   ├── auth.py                     # Authentication & JWT
│   ├── models.py                   # Database models
│   ├── schemas.py                  # Pydantic schemas
│   ├── database.py                 # Database connection
│   ├── config.py                   # Configuration
│   ├── chatbot_gemini.py          # AI chatbot
│   ├── smart_image_validator.py   # Image validation
│   ├── train_improved_model.py    # Model training
│   ├── paradetect.db              # SQLite database
│   ├── models/
│   │   └── malaria_model.pth      # Trained model
│   └── uploads/                    # Uploaded images
│
├── frontend/
│   ├── src/
│   │   ├── pages/                  # React pages
│   │   ├── components/             # React components
│   │   ├── context/                # Auth context
│   │   └── App.jsx                 # Main app
│   └── package.json
│
├── cell_images/                    # Training dataset
│   ├── Parasitized/               # 13,779 infected images
│   └── Uninfected/                # 13,779 healthy images
│
└── README.md                       # This file
```

---

## 🧪 Model Training

### Dataset
- **Total Images**: 27,558 blood cell images
- **Parasitized**: 13,779 images
- **Uninfected**: 13,779 images

### Training
```bash
cd backend
python train_improved_model.py --epochs 15 --batch_size 64
```

### Model Details
- **Architecture**: ResNet18
- **Input Size**: 224x224
- **Classes**: Parasitized, Uninfected
- **Expected Accuracy**: 95-98%

---

## 🔧 Configuration

### Backend (.env)
```env
# Google Gemini AI
GOOGLE_API_KEY=your-api-key-here

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Database
DATABASE_URL=sqlite:///./paradetect.db

# Server
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Predictions
- `POST /api/predict` - Analyze image (authenticated)
- `POST /predict` - Analyze image (public)
- `GET /api/predictions` - Get user's predictions

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - Get appointments
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment

### Chatbot
- `POST /api/chatbot` - Chat with AI (authenticated)
- `POST /api/chatbot/public` - Chat with AI (public)

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/appointments` - All appointments

---

## 🛠️ Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **PyTorch** - Deep learning framework
- **SQLAlchemy** - ORM for database
- **JWT** - Authentication
- **Google Gemini AI** - Chatbot

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

### Database
- **SQLite** - Lightweight database

---

## 🎯 Smart Image Validation

The system validates uploaded images to ensure they're blood cell microscopy images:

### Validation Checks:
- ✅ Format (PNG, JPEG only)
- ✅ Size (50x50 to 5000x5000 pixels)
- ✅ Brightness (20-240 mean intensity)
- ✅ Variance (>200 for detail)
- ✅ Color distribution
- ✅ Edge density (texture patterns)
- ✅ AI-based similarity check

### Rejection Examples:
- ❌ Screenshots
- ❌ Graphics/logos
- ❌ Random photos
- ❌ Non-microscopy images

---

## 🐛 Troubleshooting

### "Could not validate credentials"
**Solution**: Logout and login again to get fresh token

### Frontend not loading
**Solution**: 
```bash
cd frontend
npm install
npm run dev
```

### Backend errors
**Solution**:
```bash
cd backend
pip install -r requirements-pytorch.txt
python app.py
```

### Model not found
**Solution**: Train the model first
```bash
cd backend
python train_improved_model.py --epochs 15
```

### Chatbot not working
**Solution**: Add valid Google Gemini API key in `backend/.env`

---

## 📝 Development

### Run Backend
```bash
cd backend
python app.py
```

### Run Frontend
```bash
cd frontend
npm run dev
```

### Run Both (Windows)
```bash
start_backend.bat
start_frontend.bat
```

---

## 🔐 Security Notes

- Change `SECRET_KEY` in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting
- Regular security audits

---

## 📄 License

This project is for educational and research purposes.

---

## 🤝 Support

For issues or questions:
1. Check this README
2. Review API documentation at `/docs`
3. Check browser console for errors
4. Verify backend logs

---

## 🎉 Quick Reference

### Start Everything
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points
- App: http://localhost:5173
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Test Login
- Email: patient@test.com
- Password: patient123

---

**Built with ❤️ using AI and modern web technologies**
#


