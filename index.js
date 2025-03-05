const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let bets = { up: [], down: [] };

app.post('/api/place-bet', async (req, res) => {
  const { amount, direction } = req.body;
  bets[direction.toLowerCase()].push({ amount });
  res.json({ status: 'Bet placed', direction, amount });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
