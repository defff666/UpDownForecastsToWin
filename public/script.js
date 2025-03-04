const webApp = window.Telegram.WebApp;
webApp.ready();

const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(20).fill(''), // 20 точек, центр — 10
    datasets: [{
      label: 'BTC/USDT',
      data: Array(20).fill(null), // Начальные данные как null
      borderColor: '#00ff00',
      borderWidth: 2,
      pointRadius: (context) => (context.dataIndex === 10 ? 6 : 0), // Жирная круглая точка
      pointBackgroundColor: '#fff',
      pointStyle: 'circle', // Круглая форма
      fill: false,
      tension: 0.5, // Плавность
      segment: {
        borderColor: (ctx) => (ctx.p1DataIndex > 10 ? 'transparent' : '#00ff00'), // Только слева
      },
    }],
  },
  options: {
    maintainAspectRatio: false,
    animation: {
      duration: 250, // Быстрая и плавная анимация
      easing: 'easeInOutQuad',
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawTicks: false },
        ticks: { 
          color: '#fff', 
          stepSize: 0.01, // Шаг 0.01 USDT
          font: { size: 14, family: 'Arial' }, 
          maxTicksLimit: 5, 
          autoSkip: false,
          precision: 2, // 2 знака после запятой
        },
        suggestedMin: 84288 - 0.5,
        suggestedMax: 84288 + 0.5,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  },
});

const priceElement = document.getElementById('currentPrice');
let lastPrice = 84288;
let priceBuffer = [];
let priceHistory = [];

// Инициализация графика
async function initChart() {
  const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  const data = await response.json();
  lastPrice = parseFloat(data.price);
  const initialData = Array(20).fill(null);
  for (let i = 0; i <= 10; i++) {
    initialData[i] = lastPrice;
  }
  chart.data.datasets[0].data = initialData;
  chart.update();
  priceElement.textContent = `${lastPrice.toFixed(2)} USDT`;
}
initChart();

// Binance WebSocket
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const rawPrice = parseFloat(data.p);
  priceBuffer.push(rawPrice);
  priceHistory.push(rawPrice);
  if (priceHistory.length > 20) priceHistory.shift(); // 20 тиков для масштаба
};

// Обновление графика
setInterval(() => {
  if (priceBuffer.length > 0) {
    const avgPrice = priceBuffer.reduce((a, b) => a + b, 0) / priceBuffer.length;
    const smoothedPrice = lastPrice + (avgPrice - lastPrice) * 0.9; // Усиленное сглаживание
    lastPrice = smoothedPrice;

    // Динамический масштаб
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    chart.options.scales.y.suggestedMin = minPrice - 0.5;
    chart.options.scales.y.suggestedMax = maxPrice + 0.5;

    // Обновляем данные
    const currentData = chart.data.datasets[0].data.slice();
    currentData.shift();
    currentData[10] = smoothedPrice; // Точка в центре
    chart.data.datasets[0].data = currentData;
    chart.update({ duration: 250 });

    priceElement.textContent = `${smoothedPrice.toFixed(2)} USDT`;
    priceBuffer = [];
  }
}, 250); // 250 мс для плавности

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
