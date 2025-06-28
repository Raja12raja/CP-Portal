const axios = require('axios');

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint...');
    
    // Test GET endpoint first
    const getResponse = await axios.get('http://localhost:3000/api/webhooks/clerk');
    console.log('GET endpoint response:', getResponse.data);
    
    // Test POST endpoint with sample user data
    const sampleUserData = {
      type: 'user.created',
      data: {
        id: 'user_test_123',
        email_addresses: [
          {
            email_address: 'test@example.com'
          }
        ],
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        image_url: 'https://example.com/avatar.jpg'
      }
    };
    
    // Use current timestamp for testing
    const timestamp = new Date().toISOString();
    
    const postResponse = await axios.post('http://localhost:3000/api/webhooks/clerk', sampleUserData, {
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'test-id-' + Date.now(),
        'svix-timestamp': timestamp,
        'svix-signature': 'test-signature-' + Date.now()
      }
    });
    
    console.log('POST endpoint response:', postResponse.data);
    console.log('Webhook test completed successfully!');
    
  } catch (error) {
    console.error('Webhook test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

// Run the test
testWebhook(); 