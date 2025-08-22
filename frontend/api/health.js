module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://planify-snowy.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.json({ 
    status: 'OK', 
    message: 'API Planify fonctionne correctement',
    timestamp: new Date().toISOString()
  });
};
