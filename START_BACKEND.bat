@echo off
echo ========================================
echo Starting ParaDetect AI Backend Server
echo ========================================

cd backend

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo Checking model file...
if not exist "models\malaria_model.pth" (
    echo ERROR: Model file not found!
    echo Please ensure models\malaria_model.pth exists
    pause
    exit /b 1
)

echo.
echo Starting enhanced backend server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Default admin login:
echo Email: admin@paradetect.ai
echo Password: admin123
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py