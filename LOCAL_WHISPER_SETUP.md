# Local Whisper Hindi2Hinglish Setup Guide

This guide explains how to run the **Oriserve/Whisper-Hindi2Hinglish-Swift** model locally for audio transcription.

## 🎯 Why Run Locally?

- **Better Hindi2Hinglish**: The custom model is specifically trained for Hindi to Hinglish conversion
- **No API Limits**: No rate limits or API costs
- **Privacy**: Audio stays on your machine
- **Faster**: No network latency (if you have a GPU)
- **Offline**: Works without internet after model download

## 📋 Prerequisites

- **Python 3.8+** installed
- **4GB+ RAM** (8GB recommended)
- **~2GB disk space** for model
- **GPU optional** but recommended for speed

## 🚀 Quick Start

### Step 1: Navigate to Server Directory

**macOS/Linux:**
```bash
cd whisper-local-server
```

**Windows:**
```cmd
cd whisper-local-server
```

### Step 2: Run the Startup Script

**macOS/Linux:**
```bash
./start.sh
```

**Windows (Command Prompt):**
```cmd
start.bat
```

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**PowerShell Note:** If you get an execution policy error, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

This will:
1. Create a Python virtual environment
2. Install all dependencies
3. Download the Whisper model (first time only, ~1-2GB)
4. Start the server on http://localhost:5000

### Step 3: Start Your React App

In a new terminal:

```bash
cd ..
npm run dev
```

### Step 4: Test It!

1. Go to http://localhost:8080/dashboard
2. Click "File Complaint"
3. Click "Record Audio" and speak in Hindi
4. The transcription will use your local server!

## 📝 Manual Setup (Alternative)

If the script doesn't work, do it manually:

### macOS/Linux:
```bash
cd whisper-local-server

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python server.py
```

### Windows (Command Prompt):
```cmd
cd whisper-local-server

REM Create virtual environment
python -m venv venv

REM Activate it
venv\Scripts\activate.bat

REM Install dependencies
pip install -r requirements.txt

REM Start server
python server.py
```

### Windows (PowerShell):
```powershell
cd whisper-local-server

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start server
python server.py
```

## 🔧 Configuration

### Change Port

Edit `whisper-local-server/.env`:
```bash
PORT=5000  # Change to your preferred port
```

Then update the React app's `.env`:
```bash
VITE_LOCAL_WHISPER_URL=http://localhost:5000
```

### GPU vs CPU

The server automatically detects and uses GPU if available. To force CPU:

Edit `server.py` line 24:
```python
device = "cpu"  # Force CPU
```

## 🎭 How It Works

### Architecture

```
User speaks → Browser records → 
→ Sends to local server (port 5000) →
→ Whisper model transcribes →
→ Returns Hinglish text →
→ Displays in form
```

### Fallback Mechanism

The app intelligently chooses:

1. **First**: Try local server (Hindi2Hinglish)
2. **Fallback**: Use Hugging Face API (if local unavailable)

### Check Which is Being Used

Open browser console (F12) and look for:
- `"Using local Whisper server"` ✅ Local
- `"Using Hugging Face API"` 🌐 Cloud

## 📊 Performance

### CPU Mode
- **Speed**: ~10-30 seconds per minute of audio
- **RAM**: ~2-4GB
- **Good for**: Testing, low-volume usage

### GPU Mode (CUDA)
- **Speed**: ~2-5 seconds per minute of audio
- **VRAM**: ~2-3GB
- **Good for**: Production, high-volume usage

## 🧪 Testing the Server

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model": "Oriserve/Whisper-Hindi2Hinglish-Swift",
  "device": "cuda:0",
  "model_loaded": true
}
```

### Test Transcription
```bash
curl -X POST -F "audio=@test.wav" http://localhost:5000/transcribe
```

## 🐛 Troubleshooting

### Server Won't Start

**Error**: `ModuleNotFoundError: No module named 'transformers'`
```bash
pip install -r requirements.txt
```

**Error**: `CUDA out of memory`
```bash
# Use CPU mode or reduce batch size in server.py
```

### Model Download Fails

```bash
# Manually download model
huggingface-cli download Oriserve/Whisper-Hindi2Hinglish-Swift
```

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
```

### React App Can't Connect

1. Check server is running: `curl http://localhost:5000/health`
2. Check CORS is enabled (it is by default)
3. Verify `.env` has correct URL
4. Restart React dev server

## 📦 What Gets Installed

### Python Packages
- `transformers` - Hugging Face transformers library
- `torch` - PyTorch for model inference
- `torchaudio` - Audio processing
- `flask` - Web server
- `flask-cors` - CORS support
- `accelerate` - Model optimization

### Model Files (~2GB)
- Downloaded to: `~/.cache/huggingface/hub/`
- Only downloaded once
- Reused across sessions

## 🔒 Security Notes

- Server runs on localhost only (not exposed to internet)
- No authentication needed for local use
- Audio files are processed and immediately deleted
- No data is stored or logged

## 🎯 Production Deployment

For production, consider:

1. **Add Authentication**: Protect the API endpoints
2. **Use HTTPS**: Set up SSL certificates
3. **Load Balancing**: Multiple server instances
4. **Monitoring**: Add logging and metrics
5. **Docker**: Containerize for easy deployment

## 📚 API Reference

### GET /health
Check server status

**Response:**
```json
{
  "status": "healthy",
  "model": "model_name",
  "device": "cuda:0",
  "model_loaded": true
}
```

### POST /transcribe
Transcribe audio file

**Request:**
- Content-Type: `multipart/form-data`
- Body: `audio` file

**Response:**
```json
{
  "text": "transcribed text",
  "success": true
}
```

### POST /transcribe-base64
Transcribe base64 audio

**Request:**
```json
{
  "audio": "base64_encoded_audio"
}
```

**Response:**
```json
{
  "text": "transcribed text",
  "success": true
}
```

## 🎉 Benefits of Local Setup

✅ **Accurate Hindi2Hinglish** - Custom trained model
✅ **No API costs** - Free unlimited usage
✅ **Fast** - No network latency
✅ **Private** - Data stays local
✅ **Reliable** - No API rate limits
✅ **Offline** - Works without internet

## 🔄 Stopping the Server

Press `Ctrl+C` in the terminal where server is running

Or:
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9
```

## 📞 Support

If you encounter issues:

1. Check the server logs in terminal
2. Check browser console (F12)
3. Verify all dependencies are installed
4. Try restarting both servers
5. Check the GitHub issues for the model

## 🎊 Summary

You now have a local Whisper server that:
- Runs the Hindi2Hinglish model locally
- Automatically integrates with your React app
- Falls back to cloud API if unavailable
- Provides fast, accurate transcriptions

Start the server with `./start.sh` and enjoy local Hindi transcription! 🚀
