const webApp = window.Telegram.WebApp;
webApp.ready();

const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(30).fill(''), // 30 точек для компактности
    datasets: [{
      label: 'BTC/USDT',
      data: Array(30).fill(50000), // Начальные значения
      borderColor: '#00ff00',
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
      tension: 0.1,
    }],
  },
  options: {
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { display: false }, // Без оси X
      y: {
        display: false, // Без оси Y, как на BC.Game
        suggestedMin: 49900,
        suggestedMax: 50100,
      },
    },
    plugins: {
      legend: { display: false }, // Без легенды
      tooltip: { enabled: false }, // Без подсказок
    },
  },
});

// Текущая цена
const priceElement = document.getElementById('currentPrice');

// Получаем цену с CoinGecko
async function fetchPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Ошибка API:', error);
    return chart.data.datasets[0].data.slice(-1)[0];
  }
}

// Обновляем график и цену
async function updateChart() {
  const price = await fetchPrice();
  chart.data.datasets[0].data.shift();
  chart.data.datasets[0].data.push(price);
  chart.update();
  priceElement.textContent = `${price.toFixed(2)} USDT`; // Цена с 2 знаками
}

updateChart();
setInterval(updateChart, 1000); // Каждую секунду

// Таймер
let timer = 60;
const timerElement = document.getElementById('timer');
setInterval(() => {
  if (timer > 0) {
    timer--;
    timerElement.textContent = `Time: ${timer}s`;
  }
}, 1000);

// Логика ставок
const betAmountInput = document.getElementById('betAmount');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const resultElement = document.getElementById('result');

async function placeBet(direction) {
  const amount = betAmountInput.value;
  if (!amount || timer === 0) return;

  upBtn.disabled = true;
  downBtn.disabled = true;

  const response = await fetch('/api/place-bet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, direction }),
  });
  const data = await response.json();
  resultElement.textContent = data.result;

  upBtn.disabled = false;
  downBtn.disabled = false;
}

upBtn.addEventListener('click', () => placeBet('up'));
downBtn.addEventListener('click', () => placeBet('down'));
