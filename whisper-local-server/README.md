# Whisper Hindi2Hinglish Local Server

This is a local inference server for the `Oriserve/Whisper-Hindi2Hinglish-Swift` model.

## Setup

### Quick Start (Recommended)

#### On macOS/Linux:
```bash
cd whisper-local-server
./start.sh
```

#### On Windows (Command Prompt):
```cmd
cd whisper-local-server
start.bat
```

#### On Windows (PowerShell):
```powershell
cd whisper-local-server
.\start.ps1
```

**Note for PowerShell users**: If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Manual Setup (Alternative)

#### On macOS/Linux:
```bash
cd whisper-local-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

#### On Windows:
```cmd
cd whisper-local-server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```bash
GET http://localhost:5000/health
```

### Transcribe Audio File
```bash
POST http://localhost:5000/transcribe
Content-Type: multipart/form-data

Body: audio file
```

### Transcribe Base64 Audio
```bash
POST http://localhost:5000/transcribe-base64
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data"
}
```

## Testing

```bash
# Test health check
curl http://localhost:5000/health

# Test transcription with audio file
curl -X POST -F "audio=@test.wav" http://localhost:5000/transcribe
```

## Requirements

- Python 3.8+
- 4GB+ RAM (8GB recommended)
- GPU optional but recommended for faster inference

## Model Information

- **Model**: Oriserve/Whisper-Hindi2Hinglish-Swift
- **Purpose**: Transcribe Hindi audio to Hinglish (Roman script)
- **Input**: Audio files (wav, mp3, m4a, etc.)
- **Output**: Hinglish text

## Performance

- **CPU**: ~10-30 seconds per minute of audio
- **GPU**: ~2-5 seconds per minute of audio

## Troubleshooting

### Out of Memory
If you get OOM errors, try:
- Reducing `batch_size` in server.py
- Using CPU instead of GPU
- Processing shorter audio clips

### Model Download
First run will download the model (~1-2GB). This may take a few minutes.
