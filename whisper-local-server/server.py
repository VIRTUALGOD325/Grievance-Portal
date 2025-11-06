#!/usr/bin/env python3
"""
Local Whisper Hindi2Hinglish Transcription Server
Runs the Oriserve/Whisper-Hindi2Hinglish-Swift model locally
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import torch
import os
from dotenv import load_dotenv
import tempfile
import logging
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set up cache directory
CACHE_DIR = os.path.expanduser("~/.cache/huggingface/hub")
os.environ['TRANSFORMERS_CACHE'] = CACHE_DIR
os.environ['HF_HOME'] = os.path.expanduser("~/.cache/huggingface")
logger.info(f"Using cache directory: {CACHE_DIR}")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Model configuration
MODEL_NAME = "Oriserve/Whisper-Hindi2Hinglish-Swift"
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Global variables for model and processor
model = None
processor = None
pipe = None

def load_model():
    """Load the Whisper model and processor"""
    global model, processor, pipe
    
    logger.info(f"Loading model: {MODEL_NAME}")
    logger.info(f"Using device: {device}")
    logger.info(f"Cache directory: {CACHE_DIR}")
    
    # Check if model is already cached
    model_cache_path = Path(CACHE_DIR) / f"models--{MODEL_NAME.replace('/', '--')}"
    if model_cache_path.exists():
        logger.info("✅ Model found in cache - loading from disk (no download needed)")
    else:
        logger.info("⬇️  Model not in cache - will download (~2GB, one-time only)")
    
    try:
        # Load model with explicit cache directory
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch_dtype,
            low_cpu_mem_usage=True,
            use_safetensors=True,
            cache_dir=CACHE_DIR
        )
        model.to(device)
        
        # Load processor with cache
        processor = AutoProcessor.from_pretrained(MODEL_NAME, cache_dir=CACHE_DIR)
        
        # Fix tokenizer pad_token issue
        if processor.tokenizer.pad_token is None:
            processor.tokenizer.pad_token = processor.tokenizer.eos_token
            processor.tokenizer.pad_token_id = processor.tokenizer.eos_token_id
        
        # Create pipeline
        pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            max_new_tokens=128,
            chunk_length_s=30,
            batch_size=1,  # Reduced batch size to avoid issues
            return_timestamps=False,
            torch_dtype=torch_dtype,
            device=device,
        )
        
        logger.info("Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': MODEL_NAME,
        'device': device,
        'model_loaded': pipe is not None
    })

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file"""
    if pipe is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name
        
        logger.info(f"Processing audio file: {audio_file.filename}")
        
        # Transcribe
        result = pipe(temp_path)
        
        # Clean up temporary file
        os.unlink(temp_path)
        
        logger.info("Transcription completed successfully")
        
        return jsonify({
            'text': result['text'],
            'success': True
        })
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/transcribe-base64', methods=['POST'])
def transcribe_base64():
    """Transcribe audio from base64 encoded data"""
    if pipe is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        
        if 'audio' not in data:
            return jsonify({'error': 'No audio data provided'}), 400
        
        import base64
        audio_bytes = base64.b64decode(data['audio'])
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            temp_audio.write(audio_bytes)
            temp_path = temp_audio.name
        
        logger.info("Processing base64 audio data")
        
        # Transcribe
        result = pipe(temp_path)
        
        # Clean up temporary file
        os.unlink(temp_path)
        
        logger.info("Transcription completed successfully")
        
        return jsonify({
            'text': result['text'],
            'success': True
        })
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

if __name__ == '__main__':
    logger.info("Starting Whisper Hindi2Hinglish Local Server...")
    
    # Load model on startup
    if load_model():
        port = int(os.getenv('PORT', 5000))
        logger.info(f"Server starting on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        logger.error("Failed to load model. Exiting.")
        exit(1)
