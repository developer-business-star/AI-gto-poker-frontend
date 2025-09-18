/**
 * Test script to verify Android emulator connectivity to backend
 * Run with: node scripts/test-android-connection.js
 */

const testUrls = [
  'http://192.168.145.28:3001/api/health',  // Your computer's IP
  'http://10.0.2.2:3001/api/health',        // Android emulator special address
  'http://localhost:3001/api/health',        // Localhost
  'http://127.0.0.1:3001/api/health'        // Loopback
];

async function testAndroidConnection() {
  console.log('🔍 Testing Android Emulator Backend Connectivity...\n');
  console.log('📱 This simulates what your Android emulator will see\n');
  
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
  
  console.log('\n📋 Android Emulator Connection Guide:');
  console.log('1. ✅ Use 192.168.145.28:3001 (your computer\'s IP)');
  console.log('2. ⚠️  10.0.2.2:3001 only works in some emulator setups');
  console.log('3. ❌ localhost:3001 won\'t work from Android emulator');
  console.log('4. 🔄 Restart backend after CORS changes');
  console.log('5. 📱 Test login in your React Native app');
}

// Run the test
testAndroidConnection().catch(console.error); 