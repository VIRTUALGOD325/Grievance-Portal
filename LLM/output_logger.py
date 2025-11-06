#!/usr/bin/env python3
"""
Real-time logger for LLM outputs
Logs every complaint submission with input, output, and metadata
"""
import json
import os
from datetime import datetime
from pathlib import Path

class GrievanceLogger:
    """Logger for real-time LLM outputs"""
    
    def __init__(self, log_file="LLM/grievance_outputs.jsonl"):
        """Initialize logger with output file path"""
        self.log_file = log_file
        self.ensure_log_directory()
    
    def ensure_log_directory(self):
        """Create log directory if it doesn't exist"""
        log_dir = Path(self.log_file).parent
        log_dir.mkdir(parents=True, exist_ok=True)
    
    def log_output(self, user_input, llm_output, user_id=None, session_id=None, 
                   voice_input=False, additional_metadata=None):
        """
        Log a single LLM output entry
        
        Args:
            user_input (str): Original user complaint text (Hinglish/voice transcription)
            llm_output (dict): Structured JSON output from LLM with fields:
                - department
                - location
                - severity
                - description
                - summary
            user_id (str, optional): User identifier
            session_id (str, optional): Session identifier
            voice_input (bool): Whether input was from voice
            additional_metadata (dict, optional): Any additional metadata
        
        Returns:
            dict: The logged entry
        """
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Create log entry
        entry = {
            "timestamp": timestamp,
            "user_input": user_input,
            "output": llm_output,
            "metadata": {
                "user_id": user_id,
                "session_id": session_id,
                "voice_input": voice_input,
                "input_length": len(user_input),
                "has_location": bool(llm_output.get("location")),
            }
        }
        
        # Add any additional metadata
        if additional_metadata:
            entry["metadata"].update(additional_metadata)
        
        # Append to JSONL file (one JSON object per line)
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        
        print(f"✓ Logged entry at {timestamp}")
        return entry
    
    def get_recent_logs(self, limit=10):
        """Retrieve recent log entries"""
        if not os.path.exists(self.log_file):
            return []
        
        logs = []
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                logs.append(json.loads(line.strip()))
        
        return logs[-limit:]
    
    def get_statistics(self):
        """Get statistics from all logged entries"""
        if not os.path.exists(self.log_file):
            return {"total": 0}
        
        stats = {
            "total": 0,
            "departments": {},
            "severities": {},
            "voice_inputs": 0,
            "with_location": 0,
        }
        
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                entry = json.loads(line.strip())
                stats["total"] += 1
                
                output = entry["output"]
                dept = output.get("department", "unknown")
                sev = output.get("severity", "unknown")
                
                stats["departments"][dept] = stats["departments"].get(dept, 0) + 1
                stats["severities"][sev] = stats["severities"].get(sev, 0) + 1
                
                if entry["metadata"].get("voice_input"):
                    stats["voice_inputs"] += 1
                if entry["metadata"].get("has_location"):
                    stats["with_location"] += 1
        
        return stats


# Example usage function
def example_usage():
    """Example of how to use the logger"""
    logger = GrievanceLogger()
    
    # Example 1: Text input
    user_input = "pipeline phoot gai hai hamare building Charni Road ke paas"
    llm_output = {
        "department": "water_supply",
        "location": "Charni Road",
        "severity": "high",
        "description": "Pipeline rupture near Charni Road building has completely halted household work.",
        "summary": "Water pipeline burst near Charni Road building."
    }
    
    logger.log_output(
        user_input=user_input,
        llm_output=llm_output,
        user_id="user_123",
        session_id="session_456",
        voice_input=False
    )
    
    # Example 2: Voice input
    voice_input = "hamare gali mein kachra gaadi nahi aati Kurla mein"
    llm_output_2 = {
        "department": "solid_waste_management",
        "location": "Kurla",
        "severity": "high",
        "description": "Garbage collection vehicle not arriving in Kurla lane causing sanitation issues.",
        "summary": "Missing garbage collection in Kurla lane."
    }
    
    logger.log_output(
        user_input=voice_input,
        llm_output=llm_output_2,
        user_id="user_789",
        session_id="session_012",
        voice_input=True,
        additional_metadata={"device": "mobile", "language": "hinglish"}
    )
    
    # Get statistics
    stats = logger.get_statistics()
    print("\n📊 Statistics:")
    print(json.dumps(stats, indent=2))
    
    # Get recent logs
    recent = logger.get_recent_logs(limit=5)
    print(f"\n📝 Recent {len(recent)} logs:")
    for log in recent:
        print(f"  - {log['timestamp']}: {log['output']['department']} ({log['output']['severity']})")


if __name__ == "__main__":
    example_usage()
