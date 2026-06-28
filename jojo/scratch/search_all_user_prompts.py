import os
import json

brain_dir = '/Users/el/.gemini/antigravity/brain'
dirs = [d for d in os.listdir(brain_dir) if os.path.isdir(os.path.join(brain_dir, d)) and d != 'tempmediaStorage']

print("Searching all conversations for task/태스크 references...")

matches = []

for d in dirs:
    full_path = os.path.join(brain_dir, d, '.system_generated/logs/transcript_full.jsonl')
    if not os.path.exists(full_path):
        full_path = os.path.join(brain_dir, d, '.system_generated/logs/transcript.jsonl')
        if not os.path.exists(full_path):
            continue
            
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                try:
                    data = json.loads(line)
                    if data.get('type') == 'USER_INPUT':
                        content = data.get('content', '')
                        if 'task' in content.lower() or '태스크' in content or '해야할' in content or '할일' in content:
                            matches.append((d, data.get('step_index'), content))
                except:
                    pass
    except Exception as e:
        pass

print(f"\nFound {len(matches)} matches:")
for d, step_idx, content in matches:
    print(f"\n========================================\n")
    print(f"📂 Conv: {d} | Step: {step_idx}")
    print(f"========================================\n")
    print(content)

print("\nSearch complete!")
