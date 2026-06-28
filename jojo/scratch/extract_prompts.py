import json

log_path = '/Users/el/.gemini/antigravity/brain/1483b4cf-04de-46a3-8d61-96c597cb6fbb/.system_generated/logs/transcript_full.jsonl'
out_path = '/Users/el/Desktop/dodam/jojo/scratch/full_current_conversation_prompts.txt'

print("Extracting all prompts including potential older steps in active conv...")
user_inputs = []

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        if not line.strip():
            continue
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                user_inputs.append((data.get('step_index'), data.get('content'), data.get('status')))
        except Exception as e:
            pass

print(f"Total user inputs found: {len(user_inputs)}")

with open(out_path, 'w', encoding='utf-8') as out:
    for step_idx, content, status in user_inputs:
        out.write(f"\n========================================\n")
        out.write(f"💬 Step {step_idx} | Status: {status}\n")
        out.write(f"========================================\n")
        out.write(f"{content}\n")

print("Done writing!")
