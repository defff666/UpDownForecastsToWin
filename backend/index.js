const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/place-bet', async (req, res) => {
  const { amount, direction, userId } = req.body;

  const response1 = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const startPrice = response1.data.bitcoin.usd;

  await new Promise((resolve) => setTimeout(resolve, 60000));

  const response2 = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const endPrice = response2.data.bitcoin.usd;

  const won = (direction === 'up' && endPrice > startPrice) || (direction === 'down' && endPrice < startPrice);
  const result = won ? `You won ${amount * 1.9} TON!` : 'You lost!';

  res.json({ result });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
