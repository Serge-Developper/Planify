export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Test API fonctionne !',
    timestamp: new Date().toISOString()
  });
}

