#!/usr/bin/env python3
"""
Script to display JSON outputs from test.jsonl
"""
import json
import sys

def display_outputs(file_path, limit=None):
    """Display the output field from each line in the JSONL file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                if limit and i > limit:
                    break
                    
                data = json.loads(line.strip())
                output = json.loads(data['output'])
                
                print(f"\n{'='*80}")
                print(f"Example {i}")
                print(f"{'='*80}")
                print(f"Input: {data['input']}")
                print(f"\nOutput JSON:")
                print(json.dumps(output, indent=2, ensure_ascii=False))
                
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON on line {i}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = "LLM/test.jsonl"
    
    # Display first 10 examples by default, or specify a number
    limit = 10
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            print("Usage: python display_outputs.py [number_of_examples]")
            sys.exit(1)
    
    print(f"Displaying first {limit} JSON outputs from {file_path}")
    display_outputs(file_path, limit)
