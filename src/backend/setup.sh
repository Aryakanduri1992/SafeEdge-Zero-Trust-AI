#!/bin/bash

# SafeEdge Python Backend Setup Script

echo "🚀 Setting up SafeEdge Python Backend..."

# Check Python version
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cat > .env << EOF
# Cloud Provider
CLOUD_PROVIDER=firebase

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# AI Services
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
EOF
    echo "✓ .env file created. Please update with your credentials."
fi

# Check for Firebase credentials
if [ ! -f "firebase-credentials.json" ]; then
    echo "⚠️  Warning: firebase-credentials.json not found"
    echo "   Please download from Firebase Console and place in src/backend/"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys"
echo "2. Add firebase-credentials.json"
echo "3. Run: python main.py"
echo ""
