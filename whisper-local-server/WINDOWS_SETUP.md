# Windows Setup Guide - Whisper Local Server

Quick guide for Windows users to run the Whisper Hindi2Hinglish model locally.

## ✅ Prerequisites

1. **Python 3.8 or higher** installed
   - Download from: https://www.python.org/downloads/
   - ⚠️ **Important**: Check "Add Python to PATH" during installation

2. **4GB+ RAM** (8GB recommended)

3. **~2GB free disk space** for the model

## 🚀 Quick Start

### Option 1: Using Command Prompt (Easiest)

1. Open **Command Prompt** (cmd)
2. Navigate to the folder:
   ```cmd
   cd path\to\flexi-portal-hub\whisper-local-server
   ```
3. Run:
   ```cmd
   start.bat
   ```

### Option 2: Using PowerShell

1. Open **PowerShell**
2. Navigate to the folder:
   ```powershell
   cd path\to\flexi-portal-hub\whisper-local-server
   ```
3. Run:
   ```powershell
   .\start.ps1
   ```

**If you get an execution policy error:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try `.\start.ps1` again.

## 📋 What Happens

1. ✅ Creates a Python virtual environment
2. ✅ Installs required packages
3. ✅ Downloads the Whisper model (~2GB, first time only)
4. ✅ Starts server on http://localhost:5000

**First run takes longer** due to model download. Subsequent runs are fast!

## 🧪 Test if It's Working

Open a new Command Prompt/PowerShell and run:
```cmd
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "healthy",
  "model": "Oriserve/Whisper-Hindi2Hinglish-Swift",
  "model_loaded": true
}
```

## 🎯 Using with React App

1. **Keep the server running** in one terminal
2. **Open a new terminal** and run:
   ```cmd
   cd path\to\flexi-portal-hub
   npm run dev
   ```
3. Open http://localhost:8080/dashboard
4. Click "File Complaint" → "Record Audio"
5. Speak in Hindi - it will transcribe locally!

## 🐛 Common Issues

### Issue: "python is not recognized"

**Solution:** Python is not in PATH. Either:
- Reinstall Python and check "Add Python to PATH"
- Or use full path: `C:\Python39\python.exe -m venv venv`

### Issue: "pip is not recognized"

**Solution:** Use:
```cmd
python -m pip install -r requirements.txt
```

### Issue: PowerShell execution policy error

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Port 5000 already in use

**Solution:** Kill the process:
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

Or change port in `.env` file:
```
PORT=5001
```

### Issue: Out of memory

**Solution:** 
- Close other applications
- Restart your computer
- The model needs ~2-4GB RAM

### Issue: Model download is slow

**Solution:**
- Be patient, it's a 2GB download
- Check your internet connection
- Download will resume if interrupted

## 🔄 Stopping the Server

Press `Ctrl+C` in the terminal where server is running

Or close the terminal window

## 📁 File Locations

- **Virtual Environment**: `whisper-local-server\venv\`
- **Model Cache**: `C:\Users\YourName\.cache\huggingface\hub\`
- **Server Logs**: Shown in terminal

## 🎨 GPU Support (Optional)

If you have an NVIDIA GPU:

1. Install CUDA Toolkit: https://developer.nvidia.com/cuda-downloads
2. Install PyTorch with CUDA:
   ```cmd
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```
3. Restart the server

Server will automatically use GPU if available (much faster!)

## 📊 Performance

**With CPU:**
- ~10-30 seconds per minute of audio
- Works on any Windows PC

**With GPU (NVIDIA):**
- ~2-5 seconds per minute of audio
- Requires NVIDIA GPU with CUDA support

## 🔒 Firewall

Windows may ask for firewall permission. Click **"Allow access"** for:
- Python
- Flask server

This is safe - the server only runs locally.

## 📞 Quick Commands Reference

```cmd
REM Navigate to folder
cd whisper-local-server

REM Start server (Command Prompt)
start.bat

REM Start server (PowerShell)
.\start.ps1

REM Check if running
curl http://localhost:5000/health

REM Stop server
Ctrl+C

REM Clean install (if issues)
rmdir /s venv
start.bat
```

## ✨ Tips

1. **Keep terminal open** while using the app
2. **First run is slow** - model downloads once
3. **Subsequent runs are fast** - model is cached
4. **Works offline** after first download
5. **No internet needed** for transcription

## 🎉 Success!

If you see:
```
✅ Setup complete!
🚀 Starting server on http://localhost:5000
```

You're ready to go! The server is running and your React app can use it for Hindi transcription.

## 📚 Need More Help?

- Check the main `LOCAL_WHISPER_SETUP.md` for detailed info
- Check server logs in the terminal
- Verify Python version: `python --version` (should be 3.8+)
- Verify pip works: `pip --version`

---

**Remember:** Keep the server terminal open while using the app! 🚀
