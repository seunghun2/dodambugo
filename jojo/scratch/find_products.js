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

async function findProducts() {
    // 1. products 테이블 조회 시도
    const { data: products, error: prodErr } = await supabase.from('products').select('*').limit(20);
    if (prodErr) {
        console.log("❌ products table error:", prodErr.message);
    } else {
        console.log("✅ products table:", products);
        return;
    }

    // 2. flower_products 테이블 조회 시도
    const { data: flowers, error: flowErr } = await supabase.from('flower_products').select('*').limit(20);
    if (flowErr) {
        console.log("❌ flower_products table error:", flowErr.message);
    } else {
        console.log("✅ flower_products table:", flowers);
    }
}

findProducts();
