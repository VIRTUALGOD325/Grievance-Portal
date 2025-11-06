#!/bin/bash

echo "🎤 Starting Whisper Hindi2Hinglish Local Server..."
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
echo "🚀 Starting server on http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python server.py
