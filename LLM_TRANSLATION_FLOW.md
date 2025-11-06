# LLM Translation Flow & JSON Output

## Complete Flow Diagram

```
User Records Hindi Audio
         ↓
[1] Whisper Hindi2Hinglish Server (Port 5001)
    Location: whisper-local-server/server.py
    Endpoint: POST /transcribe
    ↓
    JSON Output #1 (Transcription):
    {
        "text": "Naala band ho gaya hai, gutter se paani ghar ke andar aa raha hai",
        "success": true
    }
         ↓
[2] Frontend Component (ComplaintForm.tsx)
    Location: src/components/ComplaintForm.tsx
    Line 185: const result = await transcribeAudioLocal(audio);
    Line 191: const transcribedText = result.text;
    ↓
    Sets description field with Hinglish text
         ↓
[3] AI Auto-fill Processing (if enabled)
    Location: src/components/ComplaintForm.tsx
    Line 203: await processWithAI(transcribedText);
    ↓
    Calls: categorizeGrievanceLocal(grievanceText, 'mistral')
    Location: src/services/grievance-local.ts
    Line 39: POST to http://localhost:5002/categorize
         ↓
[4] Grievance LLM Server (Port 5002)
    Location: grievance-local-server/server.py
    Endpoint: POST /categorize
    Line 200-270: categorize() function
    
    Two modes:
    
    A) FAST MODE (Default - Currently Used):
       Line 214-224: Uses quick_categorize()
       - Keyword-based pattern matching
       - No LLM inference
       - Instant response
       
       JSON Output #2 (Fast Categorization):
       {
           "text": "Department: water\nSeverity: low\nLocation: \nSummary: Naala band ho gaya hai, gutter se paani ghar ke andar aa raha hai",
           "generated_text": "Department: water\nSeverity: low\nLocation: \nSummary: Naala band ho gaya hai, gutter se paani ghar ke andar aa raha hai",
           "success": true,
           "model_used": "fast_keyword_matcher"
       }
    
    B) LLM MODE (Slow - Optional):
       Line 226-263: Uses fine-tuned LLM
       - Loads one of: Llama/Mistral/Qwen models
       - Line 252: result = pipe(prompt, max_new_tokens=150)
       - Full LLM inference on CPU
       
       JSON Output #2 (LLM Categorization):
       {
           "text": "Category: Water Supply\nPriority: high\nDepartment: WATER SUPPLY\nLocation: [extracted location]",
           "generated_text": "Category: Water Supply\nPriority: high\nDepartment: WATER SUPPLY\nLocation: [extracted location]",
           "success": true,
           "model_used": "mistral"
       }
         ↓
[5] Frontend Parsing
    Location: src/components/ComplaintForm.tsx
    Line 244: const analysis = aiResponse.generated_text;
    Line 249: const parsedData = parseAIResponse(analysis);
    Line 252-259: Auto-fills form fields
         ↓
    Form fields populated:
    - Department: WATER SUPPLY
    - Severity: Low
    - Description: Hinglish text
    - Summary: Hinglish text
```

## Key Files & Line Numbers

### 1. Hindi to Hinglish Translation
**File:** `whisper-local-server/server.py`
- **Line 130-168**: `/transcribe` endpoint
- **Line 151**: `result = pipe(temp_path)` - **WHERE WHISPER MODEL IS CALLED**
- **Line 158-161**: JSON response created

### 2. Frontend Transcription Call
**File:** `src/services/whisper-local.ts`
- **Line 31-55**: `transcribeAudioLocal()` function
- **Line 36-39**: POST request to Whisper server
- **Line 45-46**: Returns JSON result

### 3. AI Categorization Call
**File:** `src/services/grievance-local.ts`
- **Line 33-62**: `categorizeGrievanceLocal()` function
- **Line 39-45**: POST request with text, model, fast_mode
- **Line 51-52**: Returns JSON result

### 4. LLM Inference (Categorization)
**File:** `grievance-local-server/server.py`
- **Line 200-270**: `/categorize` endpoint
- **Line 214-224**: Fast mode (keyword matching) - **CURRENTLY USED**
- **Line 226-263**: LLM mode (actual model inference)
- **Line 252**: `result = pipe(prompt, max_new_tokens=150)` - **WHERE LLM IS CALLED**
- **Line 258-263**: JSON response created

### 5. Form Auto-fill
**File:** `src/components/ComplaintForm.tsx`
- **Line 217-275**: `processWithAI()` function
- **Line 238**: Calls categorization service
- **Line 244**: Gets generated text from JSON
- **Line 249**: Parses AI response
- **Line 252-259**: Updates form fields

## JSON Output Locations

### JSON Output #1: Transcription Result
**Generated at:** `whisper-local-server/server.py:158-161`
```python
return jsonify({
    'text': result['text'],
    'success': True
})
```

**Received at:** `src/services/whisper-local.ts:45-46`
```typescript
const result = await response.json();
return result;
```

### JSON Output #2: Categorization Result (Fast Mode)
**Generated at:** `grievance-local-server/server.py:219-224`
```python
return jsonify({
    'text': analysis,
    'generated_text': analysis,
    'success': True,
    'model_used': 'fast_keyword_matcher'
})
```

**Received at:** `src/services/grievance-local.ts:51-52`
```typescript
const result = await response.json();
return result;
```

### JSON Output #2: Categorization Result (LLM Mode)
**Generated at:** `grievance-local-server/server.py:258-263`
```python
return jsonify({
    'text': analysis,
    'generated_text': analysis,
    'success': True,
    'model_used': model_key
})
```

## Current Configuration

**Fast Mode is ENABLED by default:**
- File: `src/services/grievance-local.ts:36`
- `fastMode: boolean = true`

This means:
- ✅ Whisper model IS being used for Hindi→Hinglish (Port 5001)
- ⚠️ LLM models are NOT being used for categorization (Fast keyword matching instead)
- The fine-tuned Llama/Mistral/Qwen models in `/LLM` folder are loaded but not actively used

## To Enable Full LLM Mode

Change in `src/services/grievance-local.ts:36`:
```typescript
fastMode: boolean = false  // Enable LLM inference
```

This will use the fine-tuned models from:
- `Berg77/qlora-Llama-3.1-8B-Instruct-capstone-citizen-grievance`
- `Berg77/qlora-Mistral-7B-Instruct-v0.2-capstone-citizen-grievance`
- `Berg77/qlora-Qwen2.5-7B-Instruct-capstone-citizen-grievance`

## Training Data Location

The fine-tuning data is in `/LLM` folder:
- `train.jsonl` - Training dataset
- `test.jsonl` - Test dataset
- `val.jsonl` - Validation dataset
- `llama_fine_tuned_raw.jsonl` - Llama model outputs
- `mistral_fine_tuned_raw.jsonl` - Mistral model outputs
- `qwen2.5_fine_tuned_raw.jsonl` - Qwen model outputs
