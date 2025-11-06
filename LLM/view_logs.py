#!/usr/bin/env python3
"""
View and analyze logged grievance outputs
"""
import json
import sys
from datetime import datetime

def view_logs(log_file="LLM/grievance_outputs.jsonl", limit=None):
    """Display logged entries in readable format"""
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            entries = [json.loads(line) for line in f]
        
        if limit:
            entries = entries[-limit:]
        
        print(f"\n{'='*80}")
        print(f"GRIEVANCE OUTPUT LOGS ({len(entries)} entries)")
        print(f"{'='*80}\n")
        
        for i, entry in enumerate(entries, 1):
            timestamp = entry['timestamp']
            user_input = entry['user_input']
            output = entry['output']
            metadata = entry['metadata']
            
            # Parse timestamp
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            time_str = dt.strftime('%Y-%m-%d %H:%M:%S UTC')
            
            print(f"Entry #{i} - {time_str}")
            print(f"{'-'*80}")
            
            # User info
            if metadata.get('user_id'):
                print(f"👤 User: {metadata['user_id']}")
            if metadata.get('voice_input'):
                print(f"🎤 Voice Input: Yes")
            
            # Input
            print(f"\n📝 Input: {user_input}")
            
            # Output
            print(f"\n📤 Output:")
            print(f"   Department: {output['department']}")
            print(f"   Location: {output['location'] or '(not specified)'}")
            print(f"   Severity: {output['severity'].upper()}")
            print(f"   Description: {output['description']}")
            print(f"   Summary: {output['summary']}")
            
            print(f"\n{'='*80}\n")
        
    except FileNotFoundError:
        print(f"❌ Log file not found: {log_file}")
        print("No entries have been logged yet.")
        sys.exit(1)

def show_statistics(log_file="LLM/grievance_outputs.jsonl"):
    """Show statistics from logs"""
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            entries = [json.loads(line) for line in f]
        
        stats = {
            "total": len(entries),
            "departments": {},
            "severities": {},
            "voice_inputs": 0,
            "text_inputs": 0,
            "with_location": 0,
            "without_location": 0,
        }
        
        for entry in entries:
            output = entry['output']
            metadata = entry['metadata']
            
            # Count departments
            dept = output['department']
            stats['departments'][dept] = stats['departments'].get(dept, 0) + 1
            
            # Count severities
            sev = output['severity']
            stats['severities'][sev] = stats['severities'].get(sev, 0) + 1
            
            # Count input types
            if metadata.get('voice_input'):
                stats['voice_inputs'] += 1
            else:
                stats['text_inputs'] += 1
            
            # Count locations
            if output.get('location'):
                stats['with_location'] += 1
            else:
                stats['without_location'] += 1
        
        print(f"\n{'='*80}")
        print(f"STATISTICS")
        print(f"{'='*80}\n")
        
        print(f"📊 Total Entries: {stats['total']}\n")
        
        print(f"🏢 By Department:")
        for dept, count in sorted(stats['departments'].items()):
            pct = (count / stats['total'] * 100)
            print(f"   {dept}: {count} ({pct:.1f}%)")
        
        print(f"\n⚠️  By Severity:")
        severity_order = ['low', 'medium', 'high', 'critical']
        for sev in severity_order:
            count = stats['severities'].get(sev, 0)
            if count > 0:
                pct = (count / stats['total'] * 100)
                print(f"   {sev}: {count} ({pct:.1f}%)")
        
        print(f"\n🎤 Input Type:")
        print(f"   Voice: {stats['voice_inputs']}")
        print(f"   Text: {stats['text_inputs']}")
        
        print(f"\n📍 Location Data:")
        print(f"   With location: {stats['with_location']}")
        print(f"   Without location: {stats['without_location']}")
        
        print(f"\n{'='*80}\n")
        
    except FileNotFoundError:
        print(f"❌ Log file not found: {log_file}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "stats":
            show_statistics()
        else:
            try:
                limit = int(sys.argv[1])
                view_logs(limit=limit)
            except ValueError:
                print("Usage: python view_logs.py [number|stats]")
                sys.exit(1)
    else:
        view_logs(limit=10)
