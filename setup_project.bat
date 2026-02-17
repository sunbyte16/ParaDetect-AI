@echo off
echo ========================================
echo ParaDetect AI - Complete Setup Script
echo ========================================

echo.
echo Step 1: Setting up Backend...
cd backend

echo Installing Python dependencies...
pip install -r requirements-pytorch.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo Checking model file...
if not exist "models\malaria_model.pth" (
    echo ERROR: Model file not found at models\malaria_model.pth
    echo Please ensure the model file is present
    pause
    exit /b 1
)

echo.
echo Creating upload directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\gradcam" mkdir uploads\gradcam

echo.
echo Creating .env file from example...
if not exist ".env" (
    copy .env.example .env
    echo ✅ Created .env file - Please update with your settings
) else (
    echo ℹ️  .env file already exists
)

echo.
echo Step 2: Setting up Frontend...
cd ..\frontend

echo Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application:
echo 1. Run: start_backend.bat
echo 2. Run: start_frontend.bat
echo 3. Open: http://localhost:5173
echo.
echo Default admin credentials:
echo Email: admin@paradetect.ai
echo Password: admin123
echo.
pause