/**
 * Test script to verify backend connectivity
 * Run with: node scripts/test-connection.js
 */

const testUrls = [
  'http://localhost:3001/api/health',
  'http://10.0.2.2:3001/api/health',
  'http://127.0.0.1:3001/api/health'
];

async function testConnection() {
  console.log('🔍 Testing backend connectivity...\n');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS: ${url}`);
        console.log(`Response:`, data);
        console.log('---');
      } else {
        console.log(`❌ ERROR: ${url} - Status: ${response.status}`);
        console.log('---');
      }
    } catch (error) {
      console.log(`❌ FAILED: ${url}`);
      console.log(`Error: ${error.message}`);
      console.log('---');
    }
  }
  
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Make sure backend is running: cd backend && npm run dev');
  console.log('2. Check if port 3001 is available');
  console.log('3. Verify no firewall blocking the connection');
  console.log('4. For Android Emulator: Use 10.0.2.2:3001');
  console.log('5. For iOS Simulator: Use localhost:3001');
  console.log('6. For Physical Device: Use your computer\'s IP address');
}

// Run the test
testConnection().catch(console.error); 