import os
import json

brain_dir = '/Users/el/.gemini/antigravity/brain'
dirs = [d for d in os.listdir(brain_dir) if os.path.isdir(os.path.join(brain_dir, d)) and d != 'tempmediaStorage']

print("Searching for view_file task.md logs...")

for d in dirs:
    full_path = os.path.join(brain_dir, d, '.system_generated/logs/transcript_full.jsonl')
    if not os.path.exists(full_path):
        full_path = os.path.join(brain_dir, d, '.system_generated/logs/transcript.jsonl')
        if not os.path.exists(full_path):
            continue
            
    with open(full_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                # Check planner response tool calls
                for tc in data.get('tool_calls', []):
                    if tc.get('name') == 'view_file' and 'task.md' in tc.get('args', {}).get('AbsolutePath', ''):
                        print(f"\n📂 Conv: {d} | Step: {data.get('step_index')}")
                        print(f"Tool Args: {tc.get('args')}")
                
                # Check system generated tool responses
                if data.get('type') == 'TOOL_RESPONSE' and data.get('status') == 'DONE':
                    # If this is a response to view_file of task.md
                    content = data.get('content', '')
                    if 'task.md' in content and 'Total Lines' in content:
                        print(f"\n📂 TOOL_RESPONSE Conv: {d} | Step: {data.get('step_index')}")
                        # Print first 200 chars of output to verify
                        print(content[:500])
            except Exception as e:
                pass
print("\nScan complete!")
