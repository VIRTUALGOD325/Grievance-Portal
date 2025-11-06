import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client
// You'll need to set VITE_HUGGINGFACE_API_KEY in your .env file
const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);

export interface TextGenerationParams {
  model?: string;
  inputs: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
  };
}

export interface ImageGenerationParams {
  model?: string;
  inputs: string;
  parameters?: {
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
  };
}

export interface TranscriptionParams {
  model?: string;
  data: Blob | File;
}

export interface TranslationParams {
  model?: string;
  inputs: string;
}

/**
 * Generate text using Hugging Face models
 * Default: Citizen grievance fine-tuned Llama model
 */
export async function generateText(params: TextGenerationParams) {
  try {
    const model = params.model || 'Berg77/qlora-Llama-3.1-8B-Instruct-capstone-citizen-grievance';
    const response = await hf.textGeneration({
      model,
      inputs: params.inputs,
      parameters: params.parameters,
    });
    return response;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

/**
 * Generate images using Hugging Face models
 */
export async function generateImage(params: ImageGenerationParams) {
  try {
    const model = params.model || 'stabilityai/stable-diffusion-2-1';
    const response = await hf.textToImage({
      model,
      inputs: params.inputs,
      parameters: params.parameters,
    });
    return response;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Transcribe audio using Whisper models
 * Note: This requires a local Whisper server to be running
 * The Hugging Face Inference API has limited support for ASR models
 */
export async function transcribeAudio(params: TranscriptionParams) {
  try {
    // Try using the Hugging Face Inference API
    // Note: Many Whisper models don't have inference endpoints available
    const model = params.model || 'openai/whisper-large-v3';
    
    // Convert Blob/File to ArrayBuffer for the API
    const arrayBuffer = await params.data.arrayBuffer();
    
    const response = await hf.automaticSpeechRecognition({
      model,
      data: arrayBuffer,
    });
    
    return response;
  } catch (error) {
    console.error('Error transcribing audio with Hugging Face API:', error);
    
    // Provide helpful error message
    throw new Error(
      'Hugging Face API transcription failed. Please start the local Whisper server for transcription. ' +
      'See LOCAL_WHISPER_SETUP.md for instructions.'
    );
  }
}

/**
 * Translate text using Hugging Face models
 */
export async function translateText(params: TranslationParams) {
  try {
    const model = params.model || 'facebook/mbart-large-50-many-to-many-mmt';
    const response = await hf.translation({
      model,
      inputs: params.inputs,
    });
    return response;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

/**
 * Perform sentiment analysis
 */
export async function analyzeSentiment(text: string) {
  try {
    const response = await hf.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: text,
    });
    return response;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
}

/**
 * Summarize text
 */
export async function summarizeText(text: string, maxLength?: number) {
  try {
    const response = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      parameters: {
        max_length: maxLength || 130,
      },
    });
    return response;
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw error;
  }
}

/**
 * Question answering
 */
export async function answerQuestion(question: string, context: string) {
  try {
    const response = await hf.questionAnswering({
      model: 'deepset/roberta-base-squad2',
      inputs: {
        question,
        context,
      },
    });
    return response;
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
}

// Available citizen grievance models
export const GRIEVANCE_MODELS = {
  LLAMA: 'Berg77/qlora-Llama-3.1-8B-Instruct-capstone-citizen-grievance',
  MISTRAL: 'Berg77/qlora-Mistral-7B-Instruct-v0.2-capstone-citizen-grievance',
  QWEN: 'Berg77/qlora-Qwen2.5-7B-Instruct-capstone-citizen-grievance',
} as const;

export type GrievanceModel = typeof GRIEVANCE_MODELS[keyof typeof GRIEVANCE_MODELS];

export interface GrievanceParams {
  grievanceText: string;
  model?: GrievanceModel;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
  };
}

/**
 * Process citizen grievance using fine-tuned models
 * Supports Llama, Mistral, and Qwen models
 */
export async function processGrievance(params: GrievanceParams) {
  try {
    const model = params.model || GRIEVANCE_MODELS.LLAMA;
    const response = await hf.textGeneration({
      model,
      inputs: params.grievanceText,
      parameters: {
        max_new_tokens: params.parameters?.max_new_tokens || 500,
        temperature: params.parameters?.temperature || 0.7,
        top_p: params.parameters?.top_p || 0.9,
        ...params.parameters,
      },
    });
    return response;
  } catch (error) {
    console.error('Error processing grievance:', error);
    throw error;
  }
}

/**
 * Analyze and categorize citizen grievance
 */
export async function categorizeGrievance(grievanceText: string, model?: GrievanceModel) {
  try {
    const prompt = `Analyze and categorize the following citizen grievance. Provide the category, priority level, and suggested department:\n\nGrievance: ${grievanceText}\n\nAnalysis:`;
    
    const response = await hf.textGeneration({
      model: model || GRIEVANCE_MODELS.LLAMA,
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.5,
      },
    });
    return response;
  } catch (error) {
    console.error('Error categorizing grievance:', error);
    throw error;
  }
}

/**
 * Generate response to citizen grievance
 */
export async function generateGrievanceResponse(grievanceText: string, model?: GrievanceModel) {
  try {
    const prompt = `Generate a professional and empathetic response to the following citizen grievance:\n\nGrievance: ${grievanceText}\n\nResponse:`;
    
    const response = await hf.textGeneration({
      model: model || GRIEVANCE_MODELS.LLAMA,
      inputs: prompt,
      parameters: {
        max_new_tokens: 400,
        temperature: 0.7,
      },
    });
    return response;
  } catch (error) {
    console.error('Error generating grievance response:', error);
    throw error;
  }
}
