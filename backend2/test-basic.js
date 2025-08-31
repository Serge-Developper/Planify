// Test ultra-simple
console.log('Test basic.js chargé');

const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Requête reçue:', req.url);
  
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://planifymmi.fr',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true'
  });
  
  res.end(JSON.stringify({
    message: 'Test basic réussi !',
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur test basique lancé sur le port ${PORT}`);
});
