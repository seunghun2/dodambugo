const fs = require('fs');
const path = require('path');

const brainDir = '/Users/el/.gemini/antigravity/brain';
const dirs = [
    '1483b4cf-04de-46a3-8d61-96c597cb6fbb',
    '138fdf56-14b0-44e6-ac98-f17d84055273',
    'a85d831b-715b-4281-a608-064f4d5ba5bb',
    '542afc07-befa-4ba5-a103-591b8f72452d',
    'f6266b22-c9fb-4faa-84e1-d657954d16bb',
    'c7be1dea-cb99-4d57-b014-de5ce121f5d2',
    'f4700cae-e965-4a57-97d2-b9e05e36ffbc',
    '1b9a3745-0ae9-4184-a201-d3783030e02c'
];

let output = '';

for (const d of dirs) {
    const logFile = path.join(brainDir, d, '.system_generated/logs/transcript.jsonl');
    if (!fs.existsSync(logFile)) continue;
    
    output += `\n========================================\n`;
    output += `📂 Conversation ID: ${d}\n`;
    output += `========================================\n`;
    
    const lines = fs.readFileSync(logFile, 'utf8').split('\n');
    let userMsgCount = 0;
    
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const obj = JSON.parse(line);
            if (obj.type === 'USER_INPUT') {
                userMsgCount++;
                output += `\n[USER ${userMsgCount}] (Step ${obj.step_index}):\n`;
                output += `${obj.content}\n`;
            }
        } catch (e) {
            // ignore
        }
    }
}

fs.writeFileSync('/Users/el/Desktop/dodam/jojo/scratch/all_prompts.txt', output, 'utf8');
console.log('✓ Wrote to scratch/all_prompts.txt');
