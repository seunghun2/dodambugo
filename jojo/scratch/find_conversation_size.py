import os
import json

brain_dir = '/Users/el/.gemini/antigravity/brain'
all_dirs = [d for d in os.listdir(brain_dir) if os.path.isdir(os.path.join(brain_dir, d)) and d != 'tempmediaStorage']

print(f"Scanning {len(all_dirs)} conversations for user input count...")

counts = []

for d in all_dirs:
    full_path = os.path.join(brain_dir, d, '.system_generated/logs/transcript_full.jsonl')
    if not os.path.exists(full_path):
        full_path = os.path.join(brain_dir, d, '.system_generated/logs/transcript.jsonl')
        if not os.path.exists(full_path):
            continue
            
    try:
        user_msg_count = 0
        with open(full_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                try:
                    data = json.loads(line)
                    if data.get('type') == 'USER_INPUT':
                        user_msg_count += 1
                except:
                    pass
        if user_msg_count > 0:
            counts.append((d, user_msg_count, os.path.getmtime(full_path)))
    except Exception as e:
        pass

# Sort by USER msg count descending
counts.sort(key=lambda x: x[1], reverse=True)

print("\n--- LARGEST CONVERSATIONS BY USER INPUTS ---")
for d, count, mtime in counts[:30]:
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"ID: {d} | Inputs: {count} | Modified: {dt}")
