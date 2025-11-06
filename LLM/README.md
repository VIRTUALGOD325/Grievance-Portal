# LLM Output Logging System

Real-time logging system for citizen grievance LLM outputs with JSON format.

## Files

### 1. `output_logger.py`
Main logger class for capturing LLM outputs in real-time.

**Features:**
- Logs every complaint submission
- Captures user input, LLM output, and metadata
- Stores in JSONL format (one JSON per line)
- Tracks voice vs text input
- Records timestamps and user IDs

### 2. `integration_example.py`
Example showing how to integrate the logger with your LLM API.

### 3. `view_logs.py`
View and analyze logged entries.

### 4. `grievance_outputs.jsonl`
The actual log file (created automatically when first entry is logged).

## Usage

### Logging an Entry

```python
from output_logger import GrievanceLogger

# Initialize logger
logger = GrievanceLogger()

# Log a complaint
logger.log_output(
    user_input="pipeline phoot gai hai Bhandup mein",
    llm_output={
        "department": "water_supply",
        "location": "Bhandup",
        "severity": "high",
        "description": "Pipeline rupture in Bhandup area causing water supply disruption.",
        "summary": "Water pipeline burst in Bhandup."
    },
    user_id="user_12345",
    voice_input=True
)
```

### Viewing Logs

```bash
# View last 10 entries (default)
python3 LLM/view_logs.py

# View last 20 entries
python3 LLM/view_logs.py 20

# View all entries
python3 LLM/view_logs.py 999999

# View statistics
python3 LLM/view_logs.py stats
```

## Log Entry Format

Each log entry in `grievance_outputs.jsonl` contains:

```json
{
  "timestamp": "2025-11-06T20:33:03.444093Z",
  "user_input": "pipeline phoot gai hai hamare building Charni Road ke paas",
  "output": {
    "department": "water_supply",
    "location": "Charni Road",
    "severity": "high",
    "description": "Pipeline rupture near Charni Road building has completely halted household work.",
    "summary": "Water pipeline burst near Charni Road building."
  },
  "metadata": {
    "user_id": "user_123",
    "session_id": "session_456",
    "voice_input": false,
    "input_length": 58,
    "has_location": true
  }
}
```

## Integration with Your Application

### Step 1: Import the Logger

```python
from LLM.output_logger import GrievanceLogger

logger = GrievanceLogger(log_file="LLM/grievance_outputs.jsonl")
```

### Step 2: Process Complaint

```python
def handle_complaint(user_input, user_id, is_voice=False):
    # 1. Call your LLM API
    llm_response = your_llm_api_call(user_input)
    
    # 2. Parse JSON output
    llm_output = json.loads(llm_response)
    
    # 3. Log the output
    logger.log_output(
        user_input=user_input,
        llm_output=llm_output,
        user_id=user_id,
        voice_input=is_voice
    )
    
    # 4. Return for autofill
    return llm_output
```

### Step 3: Use Output for Autofill

```python
output = handle_complaint(
    user_input="kachra gaadi nahi aati",
    user_id="user_789",
    is_voice=True
)

# Autofill form fields
form.department = output['department']
form.location = output['location']
form.severity = output['severity']
form.description = output['description']
form.summary = output['summary']
```

## Voice Input Support

The logger automatically tracks whether input came from voice:

```python
# Voice input
logger.log_output(
    user_input=transcribed_text,
    llm_output=llm_response,
    voice_input=True  # ← Set this flag
)
```

## Statistics

Get real-time statistics from all logged entries:

```python
stats = logger.get_statistics()
print(f"Total complaints: {stats['total']}")
print(f"Voice inputs: {stats['voice_inputs']}")
print(f"By department: {stats['departments']}")
print(f"By severity: {stats['severities']}")
```

## File Format

- **JSONL** (JSON Lines): One JSON object per line
- Easy to append new entries
- Easy to parse and analyze
- Compatible with streaming and big data tools

## Benefits

✅ **Real-time logging** - Every complaint is logged as it happens  
✅ **Audit trail** - Track all inputs and outputs  
✅ **Analytics ready** - Analyze patterns, departments, severity  
✅ **Voice tracking** - Separate voice vs text inputs  
✅ **User tracking** - Link complaints to users  
✅ **Timestamped** - UTC timestamps for all entries  
✅ **Metadata support** - Add custom metadata fields  

## Example Output

```
================================================================================
GRIEVANCE OUTPUT LOGS (2 entries)
================================================================================

Entry #1 - 2025-11-06 20:33:03 UTC
--------------------------------------------------------------------------------
👤 User: user_123

📝 Input: pipeline phoot gai hai hamare building Charni Road ke paas

📤 Output:
   Department: water_supply
   Location: Charni Road
   Severity: HIGH
   Description: Pipeline rupture near Charni Road building...
   Summary: Water pipeline burst near Charni Road building.

================================================================================
```

## Notes

- Log file grows with each entry (one line per complaint)
- Use log rotation for production (e.g., daily/weekly rotation)
- Consider backing up logs regularly
- JSONL format allows easy import to databases or analytics tools
