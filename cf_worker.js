addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Enable CORS for preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  if (request.method === 'POST') {
    try {
      const clientIP = request.headers.get('CF-Connecting-IP') || '127.0.0.1'
      const userAgent = request.headers.get('User-Agent') || ''
      
      // Parse the incoming data
      const data = await request.json()
      
      // Use environment variables instead of hardcoded values
      const accessToken = FB_ACCESS_TOKEN
      const pixelId = FB_PIXEL_ID
      
      // Prepare user data object, including fbc if present
      const userData = {
        client_ip_address: clientIP,
        client_user_agent: userAgent,
        ...(data.user_data || {})
      }
      
      // Ensure fbc is handled correctly
      if (data.user_data && data.user_data.fbc) {
        // If fbc is already provided from client, use it as is
        userData.fbc = data.user_data.fbc
      }
      
      // Format data for Facebook Conversions API
      const payload = {
        data: [
          {
            event_name: data.event_name,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: data.source_url,
            action_source: 'website', // Add this field as it's recommended by Facebook
            user_data: userData,
            custom_data: data.custom_data || {}
          }
        ],
        access_token: accessToken
      }
      
      // Log the payload for debugging (remove in production)
      console.log('Sending payload to Facebook:', JSON.stringify(payload))
      
      // Send to Facebook
      const fbResponse = await fetch(
        `https://graph.facebook.com/v17.0/${pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )
      
      const fbResult = await fbResponse.json()
      
      // Log response from Facebook (remove in production)
      console.log('Response from Facebook:', JSON.stringify(fbResult))
      
      return corsResponse(JSON.stringify({
        success: true,
        result: fbResult
      }))
    } catch (error) {
      console.error('Error:', error)
      return corsResponse(JSON.stringify({
        success: false,
        error: error.message
      }), 500)
    }
  } else {
    return corsResponse(JSON.stringify({
      success: false,
      error: 'Please use POST method'
    }), 405)
  }
}

// Helper function for CORS headers
function corsResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
