# Grievance Server Setup Guide

## ⚠️ Important: Hugging Face Authentication Required

The Llama 3.1 model is **gated** and requires authentication with Hugging Face.

## 🔐 Step 1: Get Access to Llama Model

1. Go to: https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct
2. Click **"Request Access"**
3. Accept the terms and conditions
4. Wait for approval (usually instant)

## 🔑 Step 2: Get Your Hugging Face Token

1. Go to: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Name it (e.g., "local-models")
4. Select **"Read"** permission
5. Click **"Generate"**
6. **Copy the token** (starts with `hf_...`)

## 💻 Step 3: Login to Hugging Face CLI

### On macOS/Linux:
```bash
# Install huggingface-cli (if not already installed)
pip install huggingface-hub

# Login
huggingface-cli login
```

### On Windows:
```cmd
REM Install huggingface-cli (if not already installed)
pip install huggingface-hub

REM Login
huggingface-cli login
```

When prompted, paste your token (it won't show as you type - that's normal).

## 🚀 Step 4: Start the Server

### macOS/Linux:
```bash
./start.sh
```

### Windows:
```cmd
start.bat
```

## ✅ Verification

If login was successful, you'll see:
```
INFO:__main__:Loading model: Berg77/qlora-Llama-3.1-8B-Instruct-capstone-citizen-grievance
INFO:__main__:Model llama loaded successfully!
```

## 🔄 Alternative: Use Mistral or Qwen Instead

If you don't want to deal with Llama authentication, you can use Mistral or Qwen models instead:

Edit `grievance-local-server/.env`:
```bash
DEFAULT_MODEL=mistral  # or qwen
```

These models don't require authentication!

## 📊 Model Comparison

| Model | Size | Authentication | Speed | Accuracy |
|-------|------|----------------|-------|----------|
| Llama 3.1 8B | ~8GB | ✅ Required | Medium | High |
| Mistral 7B | ~7GB | ❌ Not Required | Fast | High |
| Qwen 2.5 7B | ~7GB | ❌ Not Required | Fast | High |

## 🐛 Troubleshooting

### Error: "Access to model is restricted"
- Make sure you requested access at https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct
- Run `huggingface-cli login` and enter your token
- Wait a few minutes after requesting access

### Error: "401 Client Error"
- Your token might be invalid
- Run `huggingface-cli login` again with a new token
- Make sure you selected "Read" permission when creating the token

### Token Not Working
```bash
# Logout and login again
huggingface-cli logout
huggingface-cli login
```

## 📝 Quick Commands

```bash
# Check if you're logged in
huggingface-cli whoami

# Logout
huggingface-cli logout

# Login
huggingface-cli login

# Test model access
python -c "from transformers import AutoTokenizer; AutoTokenizer.from_pretrained('meta-llama/Llama-3.1-8B-Instruct')"
```

## 🎯 Recommended Setup

1. **Request Llama access** (one-time, instant approval)
2. **Login with token** (`huggingface-cli login`)
3. **Start server** (`./start.sh`)
4. **First run downloads models** (~8-16GB, 10-30 minutes)
5. **Subsequent runs are instant** (models cached)

After setup, the server will work offline! 🎉
