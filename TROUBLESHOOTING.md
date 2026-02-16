# ParaDetect AI - Troubleshooting Guide

## 🚨 "Failed to analyze image" Error

This error typically occurs due to one of these issues:

### 1. Backend Server Not Running
**Symptoms:** Frontend shows "Failed to analyze image" immediately
**Solution:**
```bash
# Start the backend server
start_backend.bat
```
**Check:** Visit http://localhost:8000/health to verify server is running

### 2. Model File Missing
**Symptoms:** Backend shows "Model not found" error on startup
**Solution:**
```bash
# Check if model file exists
dir backend\models\malaria_model.pth
```
If missing, you need to obtain the trained model file.

### 3. Python Dependencies Missing
**Symptoms:** Backend fails to start with import errors
**Solution:**
```bash
cd backend
pip install -r requirements-pytorch.txt
```

### 4. Port Conflicts
**Symptoms:** Backend fails to start with "Address already in use"
**Solution:**
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### 5. CORS Issues
**Symptoms:** Frontend shows network errors in browser console
**Solution:** Backend already configured for CORS, but check if frontend URL matches

## 🔧 Quick Diagnostic Steps

### Step 1: Check Backend Health
Visit: http://localhost:8000/health

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu",
  "class_names": ["Parasitized", "Uninfected"],
  "timestamp": "2024-01-01T12:00:00"
}
```

### Step 2: Check API Documentation
Visit: http://localhost:8000/docs

Should show interactive API documentation.

### Step 3: Test Prediction Endpoint
Using curl or Postman:
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/test/image.jpg"
```

### Step 4: Check Frontend Connection
Open browser console (F12) and look for:
- Network errors
- CORS errors
- 404 errors

## 🐛 Common Issues & Solutions

### Issue: "Model not loaded" Error
**Cause:** Model file corrupted or incompatible
**Solution:**
1. Verify model file size (should be ~8MB)
2. Re-download model file if corrupted
3. Check PyTorch version compatibility

### Issue: "CUDA out of memory"
**Cause:** GPU memory insufficient
**Solution:**
```python
# Backend will automatically use CPU if CUDA fails
# Check device in health endpoint
```

### Issue: Frontend shows blank page
**Cause:** Node.js dependencies or build issues
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Database errors
**Cause:** SQLite database corruption
**Solution:**
```bash
# Delete and recreate database
del backend\paradetect.db
# Restart backend - will recreate database
```

### Issue: Authentication errors
**Cause:** JWT token issues or user not found
**Solution:**
1. Clear browser localStorage
2. Re-login with admin credentials
3. Check if admin user exists in database

## 📊 System Requirements

### Minimum Requirements:
- **Python:** 3.8+
- **Node.js:** 16+
- **RAM:** 4GB
- **Storage:** 2GB free space
- **OS:** Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Recommended Requirements:
- **Python:** 3.9+
- **Node.js:** 18+
- **RAM:** 8GB
- **Storage:** 5GB free space
- **GPU:** Optional (CUDA-compatible for faster inference)

## 🔍 Debug Mode

### Enable Verbose Logging
Add to backend startup:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Network Traffic
Use browser DevTools (F12) → Network tab to monitor API calls

### Backend Logs
Check console output when starting backend for detailed error messages

## 📞 Getting Help

### Before Asking for Help:
1. ✅ Run through this troubleshooting guide
2. ✅ Check system requirements
3. ✅ Verify all files are present
4. ✅ Test health endpoint
5. ✅ Check browser console for errors

### Information to Include:
- Operating system and version
- Python version (`python --version`)
- Node.js version (`node --version`)
- Error messages (full text)
- Browser console errors
- Backend console output

### Quick Test Commands:
```bash
# Test Python
python --version

# Test Node.js
node --version

# Test backend health
curl http://localhost:8000/health

# Test frontend build
cd frontend && npm run build
```

## ✅ Success Checklist

When everything works correctly:
- ✅ Backend starts without errors
- ✅ Health endpoint returns model_loaded: true
- ✅ Frontend loads at http://localhost:5173
- ✅ Image upload works
- ✅ Analysis completes successfully
- ✅ Results display properly
- ✅ No console errors

## 🚀 Performance Tips

### For Faster Predictions:
1. Use GPU if available (CUDA)
2. Resize images to 224x224 before upload
3. Use JPEG format for smaller file sizes
4. Close other applications to free RAM

### For Better Reliability:
1. Use stable internet connection
2. Keep backend and frontend on same machine
3. Don't modify files while server is running
4. Restart servers if they become unresponsive

Remember: Most issues are resolved by ensuring both backend and frontend servers are running properly! 🎯