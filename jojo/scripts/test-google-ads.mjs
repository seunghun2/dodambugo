async function testAccessibleCustomers() {
    try {
        console.log('Google Ads API accessible customers 조회 시도...');
        const res = await fetch('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'developer-token': 'dummy'
            }
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Error:', err);
    }
}

testAccessibleCustomers();
