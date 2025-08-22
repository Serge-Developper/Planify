// Vercel Serverless Function for items
export default function handler(request, response) {
  // Set CORS headers for all origins
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }
  
  // Return JSON response
  response.status(200).json({
    status: 'OK',
    message: 'Items API fonctionne correctement',
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    items: [
      { id: 1, name: 'Item 1', price: 100 },
      { id: 2, name: 'Item 2', price: 200 }
    ]
  });
}
