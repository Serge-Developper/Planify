// Vercel Serverless Function
export default function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }
  
  // Return JSON response
  response.status(200).json({
    status: 'OK',
    message: 'API Planify fonctionne correctement',
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });
}
