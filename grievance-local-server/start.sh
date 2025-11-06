#!/bin/bash

echo "🤖 Starting Grievance Processing Local Server..."
echo ""

# Disable MPS (Metal Performance Shaders) to force CPU usage
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0
echo "⚙️  MPS disabled - using CPU only to avoid memory issues"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting server on http://localhost:5002"
echo ""
echo "Note: First run will download models (~8-16GB total)"
echo "This may take 10-30 minutes depending on your internet speed"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python server.py
