export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle different methods
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'API Users fonctionne',
      method: 'GET'
    });
  } else if (req.method === 'POST') {
    res.status(200).json({
      message: 'API Users POST fonctionne',
      method: 'POST',
      body: req.body
    });
  } else {
    res.status(405).json({
      message: 'Méthode non autorisée',
      method: req.method
    });
  }
}

