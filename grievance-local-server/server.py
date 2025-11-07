#!/usr/bin/env python3
"""
Local Grievance Processing Server
Runs the fine-tuned citizen grievance models locally
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
import os
from dotenv import load_dotenv
import logging
from pathlib import Path

# IMPORTANT: Disable MPS (Metal Performance Shaders) on Mac BEFORE importing torch
os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'
os.environ['PYTORCH_MPS_HIGH_WATERMARK_RATIO'] = '0.0'

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

# Explicitly disable MPS backend
if hasattr(torch.backends, 'mps'):
    torch.backends.mps.is_available = lambda: False
    logger.info("MPS backend disabled - using CPU only")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Model configuration
MODELS = {
    'llama': 'Berg77/qlora-Llama-3.1-8B-Instruct-capstone-citizen-grievance',
    'mistral': 'Berg77/qlora-Mistral-7B-Instruct-v0.2-capstone-citizen-grievance',
    'qwen': 'Berg77/qlora-Qwen2.5-7B-Instruct-capstone-citizen-grievance',
}

DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'llama')

# Force CPU for Mac to avoid MPS memory issues
# MPS (Metal Performance Shaders) on Mac can run out of memory with large models
device = "cpu"
torch_dtype = torch.float32

# Uncomment below to use GPU if you have enough VRAM (16GB+)
# device = "cuda:0" if torch.cuda.is_available() else "cpu"
# torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Global variables for models
models = {}
tokenizers = {}
pipes = {}

def load_model(model_key='llama'):
    """Load a specific grievance model"""
    global models, tokenizers, pipes
    
    if model_key in pipes:
        logger.info(f"Model {model_key} already loaded in memory")
        return True
    
    model_name = MODELS.get(model_key)
    if not model_name:
        logger.error(f"Unknown model key: {model_key}")
        return False
    
    logger.info(f"Loading model: {model_name}")
    logger.info(f"Using device: {device}")
    logger.info(f"Cache directory: {CACHE_DIR}")
    
    # Check if model is already cached
    model_cache_path = Path(CACHE_DIR) / f"models--{model_name.replace('/', '--')}"
    if model_cache_path.exists():
        logger.info(f"✅ Model {model_key} found in cache - loading from disk (no download needed)")
    else:
        logger.info(f"⬇️  Model {model_key} not in cache - will download (~7-8GB, one-time only)")
    
    try:
        # Load tokenizer with cache
        tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=CACHE_DIR)
        
        # Set pad token if not present
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            tokenizer.pad_token_id = tokenizer.eos_token_id
        
        # Load model with aggressive memory optimization
        logger.info("Loading model with 8-bit quantization to reduce memory usage...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float32,  # Use float32 for CPU
            low_cpu_mem_usage=True,
            device_map=None,  # Force CPU, no automatic device mapping
            cache_dir=CACHE_DIR,
            use_cache=True,
            # Reduce memory by loading in 8-bit (requires bitsandbytes)
            load_in_8bit=False,  # Disabled for CPU compatibility
            # Alternative: use smaller precision
        )
        
        # Explicitly move to CPU
        model = model.to('cpu')
        logger.info(f"✅ Model loaded successfully on CPU")
        logger.info(f"Model memory footprint: ~{sum(p.numel() for p in model.parameters()) / 1e9:.2f}B parameters")
        
        # Create pipeline with optimized settings for faster inference
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=150,  # Reduced for faster response
            temperature=0.5,  # Lower for more focused output
            top_p=0.9,
            do_sample=True,
            device='cpu',  # Explicit CPU
        )
        
        models[model_key] = model
        tokenizers[model_key] = tokenizer
        pipes[model_key] = pipe
        
        logger.info(f"Model {model_key} loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Error loading model {model_key}: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'loaded_models': list(pipes.keys()),
        'available_models': list(MODELS.keys()),
        'device': device,
    })

def quick_categorize(text):
    """Fast keyword-based categorization (fallback when LLM is too slow)"""
    text_lower = text.lower()
    
    # Only three departments: road, water, waste
    department = "road"  # Default
    severity = "low"  # Default severity
    location = ""
    
    # Department detection (only road, water, waste)
    if any(word in text_lower for word in ['water', 'pipe', 'leak', 'supply', 'tap', 'drinking', 'paani', 'jal']):
        department = "water"
    elif any(word in text_lower for word in ['garbage', 'waste', 'trash', 'dump', 'sanitation', 'cleanliness', 'kachra', 'safai']):
        department = "waste"
    elif any(word in text_lower for word in ['road', 'pothole', 'street', 'highway', 'pavement', 'sadak', 'rasta']):
        department = "road"
    
    # Severity detection (low, medium, high, critical)
    if any(word in text_lower for word in ['critical', 'emergency', 'immediate', 'danger', 'life-threatening', 'severe']):
        severity = "critical"
    elif any(word in text_lower for word in ['urgent', 'serious', 'important', 'high']):
        severity = "high"
    elif any(word in text_lower for word in ['moderate', 'medium', 'normal']):
        severity = "medium"
    elif any(word in text_lower for word in ['minor', 'small', 'slight', 'low']):
        severity = "low"
    
    # Try to extract location (simple approach)
    import re
    location_patterns = [
        r'(?:at|in|near|location:)\s+([A-Z][a-zA-Z\s]+(?:road|street|area|colony|nagar|park)?)',
        r'([A-Z][a-zA-Z\s]+(?:road|street|area|colony|nagar|park))',
    ]
    for pattern in location_patterns:
        match = re.search(pattern, text)
        if match:
            location = match.group(1).strip()
            break
    
    # Generate a concise summary (first sentence or up to 80 chars)
    sentences = text.split('.')
    summary = sentences[0].strip() if sentences else text[:80]
    if len(summary) > 80:
        summary = summary[:80].strip() + "..."
    
    # Generate a more detailed description (full text or up to 200 chars)
    description = text.strip()
    if len(description) > 200:
        description = description[:200].strip() + "..."
    
    # If location is found, add it to description for context
    if location:
        description = f"{description} Located at {location}."
    
    analysis = f"""Department: {department}
Severity: {severity}
Location: {location if location else ''}
Description: {description}
Summary: {summary}"""
    
    return analysis

@app.route('/categorize', methods=['POST'])
def categorize():
    """Categorize a citizen grievance"""
    try:
        data = request.get_json()
        
        if 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        grievance_text = data['text']
        instruction = data.get('instruction', '')
        use_fast_mode = data.get('fast_mode', False)  # Default to LLM mode
        model_key = data.get('model', DEFAULT_MODEL)
        
        logger.info(f"Processing grievance with model={model_key}, fast_mode={use_fast_mode}")
        
        if use_fast_mode:
            # Use fast keyword-based categorization
            logger.info("Using fast keyword-based categorization")
            analysis = quick_categorize(grievance_text)
            
            return jsonify({
                'text': analysis,
                'generated_text': analysis,
                'success': True,
                'model_used': 'fast_keyword_matcher',
                'raw_output': analysis
            })
        
        # Use Berg fine-tuned LLM models
        logger.info(f"Using Berg fine-tuned model: {MODELS[model_key]}")
        
        # Load model if not already loaded
        if model_key not in pipes:
            logger.info(f"Loading model {model_key}...")
            if not load_model(model_key):
                return jsonify({'error': f'Failed to load model {model_key}'}), 500
        
        pipe = pipes[model_key]
        
        # Use the instruction format from training (if provided)
        if instruction:
            prompt = f"{instruction}\n\nComplaint: {grievance_text}"
        else:
            # Fallback to simple format
            prompt = f"Complaint: {grievance_text}"
        
        logger.info(f"Processing with Berg model: {model_key}")
        logger.info(f"Prompt length: {len(prompt)} chars")
        
        # Generate response with Berg model
        result = pipe(prompt, max_new_tokens=300, temperature=0.7, do_sample=True)
        generated_text = result[0]['generated_text']
        
        # Extract only the model's response (after the prompt)
        if instruction:
            # Remove instruction and complaint from output
            model_output = generated_text.replace(prompt, '').strip()
        else:
            model_output = generated_text.split("Complaint:")[-1].strip()
        
        logger.info(f"Raw Berg model output: {model_output}")
        
        return jsonify({
            'text': model_output,
            'generated_text': model_output,
            'success': True,
            'model_used': f'Berg77/{model_key}',
            'raw_output': model_output,
            'full_output': generated_text
        })
        
    except Exception as e:
        logger.error(f"Categorization error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/generate-response', methods=['POST'])
def generate_response():
    """Generate a response to a citizen grievance"""
    try:
        data = request.get_json()
        
        if 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        grievance_text = data['text']
        model_key = data.get('model', DEFAULT_MODEL)
        
        # Load model if not already loaded
        if model_key not in pipes:
            logger.info(f"Loading model {model_key}...")
            if not load_model(model_key):
                return jsonify({'error': f'Failed to load model {model_key}'}), 500
        
        pipe = pipes[model_key]
        
        # Create prompt for response generation
        prompt = f"""Generate a professional and empathetic response to the following citizen grievance:

Grievance: {grievance_text}

Response:"""
        
        logger.info(f"Generating response with {model_key} model")
        
        # Generate response
        result = pipe(prompt, max_new_tokens=400, temperature=0.7)
        generated_text = result[0]['generated_text']
        
        # Extract only the response part
        response = generated_text.split("Response:")[-1].strip()
        
        return jsonify({
            'text': response,
            'generated_text': response,
            'success': True,
            'model_used': model_key
        })
        
    except Exception as e:
        logger.error(f"Response generation error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/process', methods=['POST'])
def process():
    """General grievance processing"""
    try:
        data = request.get_json()
        
        if 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        grievance_text = data['text']
        model_key = data.get('model', DEFAULT_MODEL)
        
        # Load model if not already loaded
        if model_key not in pipes:
            logger.info(f"Loading model {model_key}...")
            if not load_model(model_key):
                return jsonify({'error': f'Failed to load model {model_key}'}), 500
        
        pipe = pipes[model_key]
        
        logger.info(f"Processing grievance with {model_key} model")
        
        # Generate response
        result = pipe(grievance_text, max_new_tokens=500)
        generated_text = result[0]['generated_text']
        
        return jsonify({
            'text': generated_text,
            'generated_text': generated_text,
            'success': True,
            'model_used': model_key
        })
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

if __name__ == '__main__':
    logger.info("Starting Grievance Processing Local Server...")
    
    # Load default model on startup
    logger.info(f"Loading default model: {DEFAULT_MODEL}")
    if load_model(DEFAULT_MODEL):
        port = int(os.getenv('PORT', 5002))
        logger.info(f"Server starting on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        logger.error("Failed to load default model. Exiting.")
        exit(1)
