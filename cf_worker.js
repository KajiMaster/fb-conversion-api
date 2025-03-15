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
      // Parse the incoming data
      const data = await request.json()
      
      // Use environment variables instead of hardcoded values
      const accessToken = FB_ACCESS_TOKEN
      const pixelId = FB_PIXEL_ID
      
      // Format data for Facebook Conversions API
      const payload = {
        data: [
          {
            event_name: data.event_name,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: data.source_url,
            user_data: data.user_data || {},
            custom_data: data.custom_data || {}
          }
        ],
        access_token: accessToken
      }
      
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
      return corsResponse(JSON.stringify(fbResult))
    } catch (error) {
      return corsResponse('Error: ' + error.message, 500)
    }
  } else {
    return corsResponse('Please use POST method', 405)
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
