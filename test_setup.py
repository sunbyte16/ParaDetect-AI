#!/usr/bin/env python3
"""
ParaDetect AI - Setup Test Script
Tests if the backend is properly configured and working
"""

import os
import sys
import requests
import torch
from pathlib import Path

def test_python_version():
    """Test Python version"""
    print("🐍 Testing Python version...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - Need 3.8+")
        return False

def test_dependencies():
    """Test required dependencies"""
    print("\n📦 Testing dependencies...")
    required_packages = [
        'torch', 'torchvision', 'fastapi', 'uvicorn', 
        'pillow', 'numpy', 'sqlalchemy'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing.append(package)
    
    return len(missing) == 0

def test_model_file():
    """Test if model file exists"""
    print("\n🤖 Testing model file...")
    model_path = Path("backend/models/malaria_model.pth")
    
    if model_path.exists():
        size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"✅ Model file found - {size_mb:.1f}MB")
        return True
    else:
        print("❌ Model file not found at backend/models/malaria_model.pth")
        return False

def test_directories():
    """Test required directories"""
    print("\n📁 Testing directories...")
    required_dirs = [
        "backend/uploads",
        "backend/uploads/images", 
        "backend/uploads/gradcam"
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        path = Path(dir_path)
        if path.exists():
            print(f"✅ {dir_path} - OK")
        else:
            print(f"⚠️  {dir_path} - Creating...")
            path.mkdir(parents=True, exist_ok=True)
            print(f"✅ {dir_path} - Created")
    
    return all_exist

def test_torch_device():
    """Test PyTorch device availability"""
    print("\n🖥️  Testing PyTorch device...")
    
    if torch.cuda.is_available():
        device = "cuda"
        gpu_name = torch.cuda.get_device_name(0)
        print(f"✅ CUDA available - {gpu_name}")
    else:
        device = "cpu"
        print("✅ Using CPU (CUDA not available)")
    
    print(f"Device: {device}")
    return True

def test_backend_server():
    """Test if backend server is running"""
    print("\n🌐 Testing backend server...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend server is running")
            print(f"   Model loaded: {data.get('model_loaded', 'Unknown')}")
            print(f"   Device: {data.get('device', 'Unknown')}")
            return True
        else:
            print(f"❌ Backend server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend server not running")
        print("   Start with: start_backend.bat")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def main():
    """Run all tests"""
    print("🔬 ParaDetect AI - Setup Test")
    print("=" * 40)
    
    tests = [
        ("Python Version", test_python_version),
        ("Dependencies", test_dependencies),
        ("Model File", test_model_file),
        ("Directories", test_directories),
        ("PyTorch Device", test_torch_device),
        ("Backend Server", test_backend_server)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 40)
    print("📊 Test Results Summary:")
    print("=" * 40)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:20} {status}")
        if result:
            passed += 1
    
    print(f"\nPassed: {passed}/{len(results)} tests")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Your setup is ready.")
        print("\nNext steps:")
        print("1. Run: start_backend.bat")
        print("2. Run: start_frontend.bat")
        print("3. Open: http://localhost:5173")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        print("Check TROUBLESHOOTING.md for help.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)