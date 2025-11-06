#!/usr/bin/env python3
"""
Integration example: How to use the logger with your LLM API
"""
from output_logger import GrievanceLogger
import json

# Initialize logger
logger = GrievanceLogger(log_file="LLM/grievance_outputs.jsonl")

def process_grievance(user_input, user_id=None, voice_input=False):
    """
    Process a grievance complaint and log the output
    
    Args:
        user_input (str): User's complaint in Hinglish
        user_id (str): User identifier
        voice_input (bool): Whether input came from voice
    
    Returns:
        dict: LLM output for autofill
    """
    
    # Step 1: Call your LLM API (replace with actual API call)
    llm_response = call_llm_api(user_input)
    
    # Step 2: Parse the JSON output
    llm_output = json.loads(llm_response)
    
    # Step 3: Log the output
    logger.log_output(
        user_input=user_input,
        llm_output=llm_output,
        user_id=user_id,
        voice_input=voice_input
    )
    
    # Step 4: Return output for autofill
    return llm_output


def call_llm_api(user_input):
    """
    Replace this with your actual LLM API call
    
    Example with OpenAI, Anthropic, or your custom model:
    """
    # Placeholder - replace with actual API call
    # response = openai.ChatCompletion.create(...)
    # return response.choices[0].message.content
    
    # For demo purposes, return a mock response
    return json.dumps({
        "department": "water_supply",
        "location": "Test Location",
        "severity": "high",
        "description": "Test description",
        "summary": "Test summary"
    })


# Example usage in your application
if __name__ == "__main__":
    # Simulate user submitting a complaint
    user_complaint = "pipeline phoot gai hai Bhandup mein"
    
    # Process and log
    output = process_grievance(
        user_input=user_complaint,
        user_id="user_12345",
        voice_input=False
    )
    
    print("\n✓ Grievance processed and logged!")
    print("\nAutofill data:")
    print(json.dumps(output, indent=2, ensure_ascii=False))
