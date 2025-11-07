
/**
 * Fine-tuned LLM Models Service
 * Integrates 3 fine-tuned models from HuggingFace for grievance categorization
 */

const INSTRUCTION = `You are a citizen grievance assistant for Mumbai.

Read the following complaint written in Hinglish (short conversational or ASR-style text) and extract structured grievance details.

Return ONLY a single JSON object (no extra text) with the following fields:

- department: one of ["roads_and_traffic", "water_supply", "solid_waste_management"], selected according to the grievance described in the complaint.
- location: the area or locality mentioned in the complaint (use an empty string "" if no explicit location is present).
- severity: one of ["low", "medium", "high", "critical"], chosen based on the urgency or seriousness of the grievance expressed.
- description: a complete and factual English sentence describing the grievance clearly (should mention issue, location, and impact if available).
- summary: a concise, admin-friendly summary in English highlighting the main issue for quick review.

Rules:
- Return ONLY the JSON object and nothing else.
- Keep all values as strings.
- Use the exact labels provided for department and severity.
- If no location is found, set "location": "".
- Ensure the description and summary are coherent, factual, and consistent with the complaint.`;

export type LLMModel = 'llama' | 'mistral' | 'qwen';

export interface LLMOutput {
  department: 'roads_and_traffic' | 'water_supply' | 'solid_waste_management';
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  summary: string;
}

// Local model server endpoints (running locally, not HuggingFace API)
const LOCAL_MODEL_URL = import.meta.env.VITE_LOCAL_GRIEVANCE_URL || 'http://localhost:5002';

const MODEL_ENDPOINTS: Record<LLMModel, string> = {
  llama: 'llama',    // Model identifier for local server
  mistral: 'mistral', // Model identifier for local server
  qwen: 'qwen',      // Model identifier for local server
};

const MODEL_NAMES: Record<LLMModel, string> = {
  llama: 'Llama 3.2 (Fast)',
  mistral: 'Mistral 7B (Balanced)',
  qwen: 'Qwen 2.5 (Accurate)',
};

/**
 * Parse plain text output from local model server
 */
function parsePlainTextOutput(text: string): LLMOutput {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const output: any = {
    department: 'roads_and_traffic',
    location: '',
    severity: 'medium',
    description: '',
    summary: '',
  };
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    
    if (!value) continue;
    
    const lowerKey = key.toLowerCase().trim();
    
    if (lowerKey.includes('department')) {
      // Map department variations
      const dept = value.toLowerCase();
      if (dept.includes('road') || dept.includes('traffic')) {
        output.department = 'roads_and_traffic';
      } else if (dept.includes('water')) {
        output.department = 'water_supply';
      } else if (dept.includes('waste') || dept.includes('garbage')) {
        output.department = 'solid_waste_management';
      }
    } else if (lowerKey.includes('severity')) {
      const sev = value.toLowerCase();
      if (['low', 'medium', 'high', 'critical'].includes(sev)) {
        output.severity = sev;
      }
    } else if (lowerKey.includes('location')) {
      output.location = value;
    } else if (lowerKey.includes('description')) {
      output.description = value;
    } else if (lowerKey.includes('summary')) {
      output.summary = value;
    }
  }
  
  // Ensure we have both fields (server should provide them)
  if (!output.description) {
    output.description = output.summary || 'No description provided';
  }
  
  if (!output.summary) {
    output.summary = output.description.substring(0, 80) || 'No summary provided';
  }
  
  return output as LLMOutput;
}

/**
 * Call fine-tuned LLM model via local server
 */
export async function callFineTunedLLM(
  userInput: string,
  model: LLMModel = 'llama',
  apiKey?: string
): Promise<LLMOutput> {
  const modelName = MODEL_ENDPOINTS[model];
  
  // Send both instruction and input for safety and consistency
  const prompt = `${INSTRUCTION}\n\nComplaint: ${userInput}`;

  try {
    // Call local model server
    const response = await fetch(
      `${LOCAL_MODEL_URL}/categorize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userInput,
          model: modelName,
          instruction: INSTRUCTION,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local model server error: ${error}`);
    }

    const result = await response.json();
    
    console.log('=== LOCAL SERVER RESPONSE ===');
    console.log('Model used:', result.model_used);
    console.log('Raw output from Berg model:', result.raw_output);
    console.log('Full output:', result.full_output);
    console.log('============================');
    
    // Check if the response has the expected format
    if (!result.success) {
      throw new Error(result.error || 'Model processing failed');
    }

    // Parse the generated text from local server
    const generatedText = result.generated_text || result.output || '';
    
    console.log('Generated text to parse:', generatedText);
    
    // Try to parse the output
    let parsedOutput: LLMOutput;
    try {
      // If the response is already a JSON object
      if (typeof generatedText === 'object' && generatedText !== null) {
        parsedOutput = generatedText as LLMOutput;
      } else {
        // Try to extract JSON first
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedOutput = JSON.parse(jsonMatch[0]);
        } else {
          // Parse plain text format (Department: X, Severity: Y, etc.)
          console.log('Parsing plain text format...');
          parsedOutput = parsePlainTextOutput(generatedText);
        }
      }
    } catch (parseError) {
      console.error('Parsing error:', parseError);
      // Try plain text parsing as fallback
      try {
        parsedOutput = parsePlainTextOutput(generatedText);
      } catch (fallbackError) {
        throw new Error(`Failed to parse LLM output: ${parseError}`);
      }
    }
    
    // Validate the output - ensure we have all required fields
    if (!parsedOutput.department || !parsedOutput.severity || !parsedOutput.description || !parsedOutput.summary) {
      console.error('Missing fields in LLM output:', parsedOutput);
      throw new Error('Invalid LLM output structure - missing required fields');
    }

    console.log('Final parsed output:', parsedOutput);
    return parsedOutput;
  } catch (error) {
    console.error(`Error calling ${model} model:`, error);
    throw error;
  }
}

/**
 * Get model display name
 */
export function getModelName(model: LLMModel): string {
  return MODEL_NAMES[model];
}

/**
 * Get all available models
 */
export function getAvailableModels(): Array<{ value: LLMModel; label: string }> {
  return [
    { value: 'llama', label: MODEL_NAMES.llama },
    { value: 'mistral', label: MODEL_NAMES.mistral },
    { value: 'qwen', label: MODEL_NAMES.qwen },
  ];
}

/**
 * Fallback: Use local categorization if HuggingFace fails
 */
export async function categorizeWithFallback(
  userInput: string,
  model: LLMModel = 'llama'
): Promise<LLMOutput> {
  try {
    // Try HuggingFace first
    return await callFineTunedLLM(userInput, model);
  } catch (error) {
    console.warn('HuggingFace model failed, using fallback categorization');
    
    // Fallback to simple rule-based categorization
    return simpleCategorization(userInput);
  }
}

/**
 * Simple rule-based categorization as fallback
 */
function simpleCategorization(input: string): LLMOutput {
  const lowerInput = input.toLowerCase();
  
  // Determine department
  let department: LLMOutput['department'] = 'roads_and_traffic';
  if (lowerInput.includes('water') || lowerInput.includes('paani') || lowerInput.includes('pipeline')) {
    department = 'water_supply';
  } else if (lowerInput.includes('garbage') || lowerInput.includes('kachra') || lowerInput.includes('waste')) {
    department = 'solid_waste_management';
  }
  
  // Determine severity
  let severity: LLMOutput['severity'] = 'medium';
  if (lowerInput.includes('urgent') || lowerInput.includes('emergency') || lowerInput.includes('critical')) {
    severity = 'critical';
  } else if (lowerInput.includes('serious') || lowerInput.includes('high')) {
    severity = 'high';
  } else if (lowerInput.includes('minor') || lowerInput.includes('low')) {
    severity = 'low';
  }
  
  // Extract location (simple pattern matching)
  const locationPatterns = [
    /in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /at ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /near ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
  ];
  
  let location = '';
  for (const pattern of locationPatterns) {
    const match = input.match(pattern);
    if (match) {
      location = match[1];
      break;
    }
  }
  
  return {
    department,
    location,
    severity,
    description: input,
    summary: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
  };
}
