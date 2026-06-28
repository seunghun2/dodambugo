import os
import json

brain_dir = '/Users/el/.gemini/antigravity/brain'
dirs = [d for d in os.listdir(brain_dir) if os.path.isdir(os.path.join(brain_dir, d)) and d != 'tempmediaStorage']

print("Searching for write_to_file task.md logs...")

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
                for tc in data.get('tool_calls', []):
                    name = tc.get('name', '')
                    args = tc.get('args', {})
                    target = args.get('TargetFile', '') or args.get('target', '') or args.get('AbsolutePath', '')
                    
                    if ('write_to_file' in name or 'replace_file_content' in name or 'multi_replace' in name) and 'task.md' in target:
                        print(f"\n📂 Conv: {d} | Step: {data.get('step_index')} | Tool: {name}")
                        # Print code content or replacement content
                        content = args.get('CodeContent', '') or args.get('ReplacementContent', '')
                        print(content)
            except Exception as e:
                pass
print("\nScan complete!")
