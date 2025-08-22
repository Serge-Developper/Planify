const express = require('express');
const app = express();

// Simuler l'endpoint weekly-items
app.get('/test-weekly', (req, res) => {
  const allWeeklyItems = [
    { id: 1, name: 'Oreilles de chat', price: 50, img: '/src/assets/img/oreilleschat.gif' },
    { id: 2, name: 'Clown', price: 80, img: '/src/assets/img/clowncheveux.gif' },
    { id: 3, name: 'Cash', price: 60, img: '/src/assets/img/cash.gif' }
  ];

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const timeLeft = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const timeUntilReset = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  res.json({
    success: true,
    weeklyItems: allWeeklyItems.slice(0, 3),
    timeUntilReset,
    daySeed: now.toISOString().split('T')[0],
    nextReset: tomorrow.toISOString()
  });
});

app.listen(3001, () => {
  console.log('Serveur de test démarré sur le port 3001');
  console.log('Testez avec: http://localhost:3001/test-weekly');
});
