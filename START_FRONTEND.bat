@echo off
echo ========================================
echo Starting ParaDetect AI Frontend
echo ========================================

cd frontend

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
)

echo.
echo Starting development server...
echo Frontend will be available at: http://localhost:5173
echo.
echo Make sure the backend is running on port 8000
echo Press Ctrl+C to stop the server
echo.

npm run dev