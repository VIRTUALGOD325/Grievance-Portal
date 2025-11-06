/**
 * Local Grievance Processing Service
 * Connects to local Python server running fine-tuned grievance models
 */

const LOCAL_GRIEVANCE_URL = import.meta.env.VITE_LOCAL_GRIEVANCE_URL || 'http://localhost:5002';

export interface GrievanceResult {
  text: string;
  generated_text: string;
  success: boolean;
  error?: string;
  model_used?: string;
}

/**
 * Check if local Grievance server is running
 */
export async function checkLocalGrievanceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCAL_GRIEVANCE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Local Grievance server not available:', error);
    return false;
  }
}

/**
 * Categorize grievance using local server
 */
export async function categorizeGrievanceLocal(
  text: string,
  model: 'llama' | 'mistral' | 'qwen' = 'mistral',
  fastMode: boolean = true
): Promise<GrievanceResult> {
  try {
    const response = await fetch(`${LOCAL_GRIEVANCE_URL}/categorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model, fast_mode: fastMode }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Local categorization error:', error);
    return {
      text: '',
      generated_text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate response to grievance using local server
 */
export async function generateGrievanceResponseLocal(
  text: string,
  model: 'llama' | 'mistral' | 'qwen' = 'mistral'
): Promise<GrievanceResult> {
  try {
    const response = await fetch(`${LOCAL_GRIEVANCE_URL}/generate-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Local response generation error:', error);
    return {
      text: '',
      generated_text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process grievance using local server
 */
export async function processGrievanceLocal(
  text: string,
  model: 'llama' | 'mistral' | 'qwen' = 'mistral'
): Promise<GrievanceResult> {
  try {
    const response = await fetch(`${LOCAL_GRIEVANCE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Local processing error:', error);
    return {
      text: '',
      generated_text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
