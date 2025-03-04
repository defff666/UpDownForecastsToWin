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
      pointRadius: (context) => (context.dataIndex === 15 ? 4 : 0), // Точка в середине
      pointBackgroundColor: '#fff',
      fill: false,
      tension: 0.5, // Плавность
    }],
  },
  options: {
    maintainAspectRatio: false,
    animation: {
      duration: 500, // Плавная анимация
      easing: 'easeInOutQuad',
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawTicks: false },
        ticks: { color: '#fff', stepSize: 50, font: { size: 10 }, maxTicksLimit: 5 },
        suggestedMin: 84200,
        suggestedMax: 84400,
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
  chart.data.datasets[0].data.fill(lastPrice); // Заполняем стартовую цену
  chart.data.datasets[0].data[15] = lastPrice; // Точка в середине
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
  if (priceHistory.length > 10) priceHistory.shift();
};

// Обновление графика
setInterval(() => {
  if (priceBuffer.length > 0) {
    const avgPrice = priceBuffer.reduce((a, b) => a + b, 0) / priceBuffer.length;
    const smoothedPrice = lastPrice + (avgPrice - lastPrice) * 0.8; // Сглаживание
    lastPrice = smoothedPrice;

    // Динамический масштаб
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    chart.options.scales.y.suggestedMin = Math.floor(minPrice / 50) * 50 - 50;
    chart.options.scales.y.suggestedMax = Math.ceil(maxPrice / 50) * 50 + 50;

    // Плавное обновление: сдвигаем и добавляем точку
    const currentData = [...chart.data.datasets[0].data]; // Копируем текущие данные
    currentData.shift(); // Убираем первую точку
    currentData[15] = smoothedPrice; // Точка в середине
    chart.data.datasets[0].data = currentData; // Присваиваем обновлённые данные
    chart.update({ duration: 500 }); // Плавный апдейт

    priceElement.textContent = `${smoothedPrice.toFixed(2)} USDT`;
    priceBuffer = [];
  }
}, 500); // 500 мс

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
