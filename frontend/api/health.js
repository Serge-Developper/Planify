export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: 'OK', 
    message: 'API Planify fonctionne correctement',
    timestamp: new Date().toISOString()
  });
}
