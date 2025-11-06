/**
 * Local Whisper Transcription Service
 * Connects to local Python server running Whisper Hindi2Hinglish model
 */

const LOCAL_WHISPER_URL = import.meta.env.VITE_LOCAL_WHISPER_URL || 'http://localhost:5001';

export interface LocalTranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Check if local Whisper server is running
 */
export async function checkLocalWhisperHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCAL_WHISPER_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy' && data.model_loaded;
  } catch (error) {
    console.error('Local Whisper server not available:', error);
    return false;
  }
}

/**
 * Transcribe audio using local Whisper server
 */
export async function transcribeAudioLocal(audioBlob: Blob): Promise<LocalTranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await fetch(`${LOCAL_WHISPER_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Local transcription error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export interface LocalSummaryResult {
  summary_text: string;
  success: boolean;
  error?: string;
}

/**
 * Summarize text using local server
 */
export async function summarizeTextLocal(text: string, maxLength?: number): Promise<LocalSummaryResult> {
  try {
    const response = await fetch(`${LOCAL_WHISPER_URL}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        max_length: maxLength || 130,
        min_length: 30,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Local summarization error:', error);
    return {
      summary_text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Transcribe audio file using local Whisper server
 */
export async function transcribeAudioFileLocal(file: File): Promise<LocalTranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch(`${LOCAL_WHISPER_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Local transcription error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert audio blob to base64 and transcribe
 */
export async function transcribeAudioBase64Local(audioBlob: Blob): Promise<LocalTranscriptionResult> {
  try {
    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob);

    const response = await fetch(`${LOCAL_WHISPER_URL}/transcribe-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio: base64Audio }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Local transcription error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper function to convert Blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface TranslationResult {
  translated_text: string;
  original_text: string;
  success: boolean;
  error?: string;
}

/**
 * Translate Hinglish/Hindi text to English using local server
 */
export async function translateToEnglishLocal(text: string): Promise<TranslationResult> {
  try {
    const response = await fetch(`${LOCAL_WHISPER_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translated_text: '',
      original_text: text,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
