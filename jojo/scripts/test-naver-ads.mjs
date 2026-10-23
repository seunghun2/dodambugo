import crypto from 'crypto';

const ACCESS_LICENSE = '0100000000e412a734d595eda2c3fed12d693a20f99c5ce1c3df63c238030be52bd5cd3e58';
const SECRET_KEY = 'AQAAAADkEqc01ZXtosP+0S1pOiD5fNlkEx2S6OnKIH/uZFdhXQ==';
const BASE_URL = 'https://api.searchad.naver.com';

function generateSignature(timestamp, method, path, secretKey) {
    const basePath = path.split('?')[0];
    const message = `${timestamp}.${method}.${basePath}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

async function testNaverApi(customerId) {
    console.log(`\nTesting with Customer ID: ${customerId}`);
    const timestamp = Date.now().toString();
    const method = 'GET';
    const path = '/billing/bizmoney';
    const signature = generateSignature(timestamp, method, path, SECRET_KEY);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': ACCESS_LICENSE,
                'X-Customer': customerId,
                'X-Signature': signature,
            }
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

async function testCampaigns(customerId) {
    console.log(`\nTesting /ncc/campaigns with Customer ID: ${customerId}`);
    const timestamp = Date.now().toString();
    const method = 'GET';
    const path = '/ncc/campaigns';
    const signature = generateSignature(timestamp, method, path, SECRET_KEY);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': ACCESS_LICENSE,
                'X-Customer': customerId,
                'X-Signature': signature,
            }
        });

        console.log(`Campaigns Status: ${res.status} ${res.statusText}`);
        const data = await res.json();
        console.log('Campaigns:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Campaigns Error:', err);
    }
}

async function testStats(customerId, campaignId) {
    console.log(`\nTesting /stats with Campaign ID: ${campaignId}`);
    const timestamp = Date.now().toString();
    const method = 'GET';
    const fields = encodeURIComponent('["impCnt","clkCnt","salesAmt","ctr","cpc","avgRnk"]');
    const timeRange = encodeURIComponent('{"since":"2026-08-01","until":"2026-08-30"}');
    const path = `/stats?id=${campaignId}&fields=${fields}&timeRange=${timeRange}`;
    const signature = generateSignature(timestamp, method, path, SECRET_KEY);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': ACCESS_LICENSE,
                'X-Customer': customerId,
                'X-Signature': signature,
            }
        });

        console.log(`Stats Status: ${res.status} ${res.statusText}`);
        const data = await res.json();
        console.log('Stats Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Stats Error:', err);
    }
}

async function main() {
    await testNaverApi('4257905');
    await testCampaigns('4257905');
    await testStats('4257905', 'cmp-a001-01-000000010252118');
}

main();
