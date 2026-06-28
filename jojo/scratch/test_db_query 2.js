const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 로드
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

async function test() {
    try {
        // 테이블의 1개 로우를 조회하여 컬럼 키 목록 확인
        const { data, error } = await supabase.from('bugo').select('*').limit(1);
        if (error) {
            console.error("❌ Supabase select error:", error);
        } else {
            console.log("✅ Columns found in 'bugo' table:");
            if (data.length > 0) {
                console.log(Object.keys(data[0]));
            } else {
                console.log("No rows found. Attempting to select information_schema via postgres...");
                // 빈 테이블일 경우, 임의의 쿼리를 날려서 칼럼 정보를 얻거나, postgrest에 존재하지 않는 컬럼을 select해서 list를 보거나,
                // 또는 rpc가 정의되어 있는지 확인.
                // 또는 그냥 select('*')에 대해 API 요청 결과 헤더를 보거나.
            }
        }
    } catch (e) {
        console.error("❌ Runtime Error:", e);
    }
}

test();
