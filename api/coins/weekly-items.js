// Simple wrapper that redirects to main coins.js function
const coinsHandler = require('../coins.js');

module.exports = async (req, res) => {
  // Modify the URL to make it look like it came from the main coins endpoint
  req.url = '/api/coins/weekly-items';
  return coinsHandler(req, res);
};