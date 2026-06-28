const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/b2b/settings/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the import line
content = content.replace(/import\s+{\s*BottomTabBar\s*}\s*from\s*'@\/components\/b2b\/BottomTabBar';\r?\n/, '');

// 2. Remove all occurrences of <BottomTabBar /> (possibly with leading whitespace)
// Matches: <BottomTabBar /> or <BottomTabBar/> with optional trailing newline/spaces
content = content.replace(/\r?\n\s*<BottomTabBar\s*\/>/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed BottomTabBar from settings/page.tsx');
