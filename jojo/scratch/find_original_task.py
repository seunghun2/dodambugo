import json
import re

log_path = '/Users/el/.gemini/antigravity/brain/1483b4cf-04de-46a3-8d61-96c597cb6fbb/.system_generated/logs/transcript_full.jsonl'

print("Scanning for initial artifacts context...")

with open(log_path, 'r', encoding='utf-8') as f:
    first_line = f.readline()
    if first_line:
        try:
            data = json.loads(first_line)
            content = data.get('content', '')
            
            # Search for task.md or [ARTIFACT: task] inside content
            print("Found first line content length:", len(content))
            
            # Let's save the first line content to a file to inspect it manually
            with open('/Users/el/Desktop/dodam/jojo/scratch/first_step_context.txt', 'w', encoding='utf-8') as out:
                out.write(content)
            print("Wrote first step context to scratch/first_step_context.txt")
            
            # Also search for task.md references
            matches = re.findall(r'task\.md.*?(?=\n\n|\n\[|\n#|\Z)', content, re.DOTALL | re.IGNORECASE)
            print(f"Found {len(matches)} potential task.md regex matches:")
            for m in matches[:5]:
                print("--- MATCH ---")
                print(m)
        except Exception as e:
            print("Failed to parse first line as JSON:", e)
