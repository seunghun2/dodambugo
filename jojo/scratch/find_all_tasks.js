const fs = require('fs');
const path = require('path');

const brainDir = '/Users/el/.gemini/antigravity/brain';

function findTasks(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (f === '.system_generated' || f === 'tempmediaStorage' || f === 'scratch') continue;
            findTasks(fullPath);
        } else if (f === 'task.md') {
            console.log(`\n========================================`);
            console.log(`📄 Task File: ${fullPath}`);
            console.log(`Modified: ${stat.mtime}`);
            console.log(`========================================`);
            console.log(fs.readFileSync(fullPath, 'utf8'));
        }
    }
}

console.log('🔍 Searching all task.md files in brain...');
findTasks(brainDir);
console.log('🌟 Done!');
