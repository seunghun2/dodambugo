fetch('http://localhost:3001/api/verify-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    bankCd: '004', 
    accountNo: '47810201225438', 
    holderName: '백승훈' 
  })
}).then(res => res.json()).then(console.log).catch(console.error);
