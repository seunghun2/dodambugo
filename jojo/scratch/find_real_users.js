const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let envData = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            envData[match[1]] = value;
        }
    });
}

const supabase = createClient(
    envData.NEXT_PUBLIC_SUPABASE_URL,
    envData.SUPABASE_SERVICE_ROLE_KEY
);

async function findUsers() {
    const { data, error } = await supabase.from('b2b_users').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) {
        console.error("Error fetching b2b_users:", error);
    } else {
        console.log("=== B2B Users List ===");
        console.log(data);
    }
}

findUsers();
