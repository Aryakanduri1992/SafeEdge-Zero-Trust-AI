@echo off
REM SafeEdge Python Backend Setup Script (Windows)

echo 🚀 Setting up SafeEdge Python Backend...

REM Check Python version
python --version
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    exit /b 1
)

REM Create virtual environment
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Check for .env file
if not exist ".env" (
    echo ⚙️  Creating .env file from template...
    (
        echo # Cloud Provider
        echo CLOUD_PROVIDER=firebase
        echo.
        echo # Firebase Configuration
        echo FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
        echo FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
        echo.
        echo # AI Services
        echo GROQ_API_KEY=your_groq_api_key
        echo ELEVENLABS_API_KEY=your_elevenlabs_api_key
        echo.
        echo # API Configuration
        echo API_HOST=0.0.0.0
        echo API_PORT=8000
        echo API_RELOAD=true
    ) > .env
    echo ✓ .env file created. Please update with your credentials.
)

REM Check for Firebase credentials
if not exist "firebase-credentials.json" (
    echo ⚠️  Warning: firebase-credentials.json not found
    echo    Please download from Firebase Console and place in src\backend\
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update .env with your API keys
echo 2. Add firebase-credentials.json
echo 3. Run: python main.py
echo.

pause
