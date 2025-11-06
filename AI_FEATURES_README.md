# AI Features Documentation

This document explains how to use the integrated Hugging Face models and Whisper transcription in the Flexi Portal Hub.

## Overview

The application integrates several custom-trained AI models specifically designed for citizen grievance processing:

### Models Integrated

1. **Whisper Hindi2Hinglish** - `Oriserve/Whisper-Hindi2Hinglish-Swift`
   - Transcribes Hindi audio to Hinglish (Roman script)
   - Fast inference with Swift variant
   - Perfect for processing citizen voice complaints

2. **Llama 3.1 8B** - `Berg77/qlora-Llama-3.1-8B-Instruct-capstone-citizen-grievance`
   - Fine-tuned for citizen grievance processing
   - Excellent reasoning and context understanding
   - Best for complex grievance analysis

3. **Mistral 7B** - `Berg77/qlora-Mistral-7B-Instruct-v0.2-capstone-citizen-grievance`
   - Efficient and fast processing
   - Strong classification capabilities
   - Good for quick categorization

4. **Qwen 2.5 7B** - `Berg77/qlora-Qwen2.5-7B-Instruct-capstone-citizen-grievance`
   - Advanced multilingual understanding
   - Nuanced response generation
   - Excellent for multi-language support

## Setup Instructions

### 1. Get Your Hugging Face API Key

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" permissions
3. Copy the token

### 2. Configure Environment Variables

Add your API key to the `.env` file:

```bash
VITE_HUGGINGFACE_API_KEY="your_api_key_here"
```

### 3. Install Dependencies

The required dependency `@huggingface/inference` has already been installed.

### 4. Start the Development Server

```bash
npm run dev
```

## Features

### 1. Audio Transcription (Whisper)

Navigate to `/ai-features` and select the "Audio Transcription" tab.

**Features:**
- **Record Audio**: Click "Start Recording" to record directly from your microphone
- **Upload Audio**: Upload pre-recorded audio files (supports most audio formats)
- **Automatic Transcription**: Audio is automatically transcribed to Hinglish
- **Download Transcription**: Save transcriptions as text files

**Use Cases:**
- Transcribe citizen voice complaints
- Convert Hindi audio grievances to text
- Process phone call recordings

### 2. Grievance Processing

Navigate to `/ai-features` and select the "Grievance Processing" tab.

**Three Processing Modes:**

#### Process
- General grievance processing and analysis
- Extracts key information from grievances
- Provides structured output

#### Categorize
- Automatically categorizes grievances
- Assigns priority levels
- Suggests appropriate departments
- Helps with routing and triage

#### Respond
- Generates professional responses to grievances
- Empathetic and contextually appropriate
- Ready-to-use response templates

**Model Selection:**
- Choose between Llama, Mistral, or Qwen models
- Each model has different strengths
- Test different models to find the best fit

## API Service Functions

The `src/services/huggingface.ts` file provides several utility functions:

### Core Functions

```typescript
// Transcribe audio
transcribeAudio({ data: audioBlob, model?: string })

// Process grievance
processGrievance({ 
  grievanceText: string, 
  model?: GrievanceModel,
  parameters?: { max_new_tokens, temperature, top_p }
})

// Categorize grievance
categorizeGrievance(grievanceText: string, model?: GrievanceModel)

// Generate response
generateGrievanceResponse(grievanceText: string, model?: GrievanceModel)
```

### Additional Functions

```typescript
// General text generation
generateText({ inputs: string, model?: string, parameters?: {...} })

// Image generation
generateImage({ inputs: string, model?: string, parameters?: {...} })

// Text translation
translateText({ inputs: string, model?: string })

// Sentiment analysis
analyzeSentiment(text: string)

// Text summarization
summarizeText(text: string, maxLength?: number)

// Question answering
answerQuestion(question: string, context: string)
```

## Usage Examples

### Example 1: Transcribe Audio in Your Component

```typescript
import { transcribeAudio } from '@/services/huggingface';

const handleAudioUpload = async (file: File) => {
  try {
    const result = await transcribeAudio({ data: file });
    console.log('Transcription:', result.text);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example 2: Process Grievance with Specific Model

```typescript
import { processGrievance, GRIEVANCE_MODELS } from '@/services/huggingface';

const handleGrievance = async (text: string) => {
  try {
    const result = await processGrievance({
      grievanceText: text,
      model: GRIEVANCE_MODELS.LLAMA,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
      }
    });
    console.log('Response:', result.generated_text);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example 3: Categorize and Respond

```typescript
import { categorizeGrievance, generateGrievanceResponse } from '@/services/huggingface';

const processCompleteGrievance = async (text: string) => {
  // First categorize
  const category = await categorizeGrievance(text);
  console.log('Category:', category.generated_text);
  
  // Then generate response
  const response = await generateGrievanceResponse(text);
  console.log('Response:', response.generated_text);
};
```

## Model Parameters

### Temperature
- Range: 0.0 - 1.0
- Lower values (0.3-0.5): More focused, deterministic responses
- Higher values (0.7-0.9): More creative, varied responses

### max_new_tokens
- Controls the length of generated text
- Recommended: 300-500 for responses, 100-200 for categorization

### top_p
- Range: 0.0 - 1.0
- Controls diversity of responses
- Recommended: 0.9 for balanced results

## Troubleshooting

### API Key Issues
- Ensure your API key is correctly set in `.env`
- Restart the dev server after adding the key
- Check that the key has proper permissions

### Model Loading Errors
- Some models may take time to load on first request
- Wait 30-60 seconds for initial model loading
- Subsequent requests will be faster

### Rate Limits
- Free tier has rate limits
- Consider upgrading for production use
- Implement proper error handling and retry logic

### CORS Issues
- Hugging Face Inference API handles CORS
- If issues persist, check browser console
- Ensure you're using the latest version of `@huggingface/inference`

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Loading States**: Show loading indicators during processing
3. **User Feedback**: Provide clear feedback on success/failure
4. **Model Selection**: Test different models for your use case
5. **Parameter Tuning**: Adjust temperature and tokens based on needs
6. **Caching**: Consider caching responses for repeated queries
7. **Privacy**: Handle sensitive grievance data securely

## Next Steps

- Integrate AI features into the main dashboard
- Add batch processing capabilities
- Implement response templates
- Create analytics for grievance trends
- Add multi-language support beyond Hindi/Hinglish

## Support

For issues with:
- **Models**: Check the Hugging Face model pages
- **API**: Visit [Hugging Face Documentation](https://huggingface.co/docs/api-inference)
- **Integration**: Review the code in `src/services/huggingface.ts`
