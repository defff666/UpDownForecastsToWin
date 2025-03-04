const webApp = window.Telegram.WebApp;
webApp.ready();

const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(30).fill(''), // 30 точек
    datasets: [{
      label: 'BTC/USDT',
      data: Array(30).fill(84288), // Начальная цена
      borderColor: '#00ff00',
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.4, // Плавность линий
    }],
  },
  options: {
    maintainAspectRatio: false,
    animation: {
      duration: 200, // Плавная анимация
      easing: 'linear',
    },
    scales: {
      x: { display: false },
      y: {
        display: false,
        suggestedMin: 84280, // Узкий диапазон для видимости изменений
        suggestedMax: 84296,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  },
});

const priceElement = document.getElementById('currentPrice');
let lastPrice = 84288; // Начальная цена для сглаживания

// Binance WebSocket
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const rawPrice = parseFloat(data.p);

  // Сглаживание: интерполяция между последней ценой и новой
  const smoothedPrice = lastPrice + (rawPrice - lastPrice) * 0.3; // 30% шага для плавности
  lastPrice = smoothedPrice;

  chart.data.datasets[0].data.shift();
  chart.data.datasets[0].data.push(smoothedPrice);
  chart.update();
  priceElement.textContent = `${smoothedPrice.toFixed(2)} USDT`;
};

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
