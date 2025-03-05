const webApp = window.Telegram.WebApp;
webApp.ready();

const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(20).fill(''),
    datasets: [{
      label: 'BTC/USDT',
      data: Array(20).fill(null),
      borderColor: '#00ff00',
      borderWidth: 2,
      pointRadius: (context) => (context.dataIndex === 10 ? 6 : 0),
      pointBackgroundColor: '#fff',
      pointStyle: 'circle',
      fill: false,
      tension: 0.3,
      segment: {
        borderColor: (ctx) => {
          const index = ctx.p1DataIndex;
          const startIdx = chart.startIndex || 0;
          const finishIdx = chart.finishIndex || 20;
          if (index > 10) return 'transparent'; // Справа от точки не рисуем
          if (index >= startIdx && index <= finishIdx) return '#ffff00'; // Жёлтый между маркерами
          return '#00ff00';
        },
      },
    }],
  },
  options: {
    maintainAspectRatio: false,
    animation: {
      duration: 250,
      easing: 'linear',
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawTicks: false },
        ticks: { 
          color: '#fff', 
          stepSize: 0.01, 
          font: { size: 14, family: 'Arial' }, 
          maxTicksLimit: 5, 
          autoSkip: false,
          precision: 2,
        },
        suggestedMin: 84288 - 0.5,
        suggestedMax: 84288 + 0.5,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      annotation: {
        annotations: {
          startPin: {
            type: 'line',
            xMin: 0,
            xMax: 0,
            borderColor: '#fff',
            borderWidth: 2,
            label: { enabled: false },
            drawTime: 'afterDatasetsDraw',
          },
          finishMarker: {
            type: 'line',
            xMin: 20,
            xMax: 20,
            borderColor: '#ff0000',
            borderWidth: 2,
            label: { enabled: false },
            drawTime: 'afterDatasetsDraw',
          },
        },
      },
    },
  },
});

const priceElement = document.getElementById('currentPrice');
const timerElement = document.getElementById('timer');
const betAmountInput = document.getElementById('betAmount');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const resultElement = document.getElementById('result');

let lastPrice = 84288;
let priceBuffer = [];
let priceHistory = [];
let phase = 'betting'; // 'betting' или 'game'
let timer = 30; // 30 сек для ставок
let bets = { up: [], down: [] };
let startPrice = null;
let finishPrice = null;

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
  if (priceHistory.length > 20) priceHistory.shift();
};

// Обновление графика
setInterval(() => {
  if (priceBuffer.length > 0) {
    const avgPrice = priceBuffer.reduce((a, b) => a + b, 0) / priceBuffer.length;
    lastPrice = avgPrice;

    // Динамический масштаб
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    chart.options.scales.y.suggestedMin = minPrice - 0.5;
    chart.options.scales.y.suggestedMax = maxPrice + 0.5;

    // Сдвигаем как лист бумаги
    const currentData = chart.data.datasets[0].data.slice();
    currentData.shift();
    currentData[10] = lastPrice;
    chart.data.datasets[0].data = currentData;
    chart.update({ duration: 250 });

    priceElement.textContent = `${lastPrice.toFixed(2)} USDT`;
    priceBuffer = [];
  }
}, 250);

// Таймер и логика фаз
setInterval(() => {
  if (timer > 0) {
    timer--;
    timerElement.textContent = phase === 'betting' ? `Bets close in: ${timer}s` : `Game ends in: ${timer}s`;
  } else {
    if (phase === 'betting') {
      // Переход к фазе игры
      phase = 'game';
      timer = 10; // 10 сек для игры
      startPrice = lastPrice;
      chart.startIndex = 10; // Фиксируем старт
      chart.options.plugins.annotation.annotations.startPin.xMin = 10;
      chart.options.plugins.annotation.annotations.startPin.xMax = 10;
    } else if (phase === 'game') {
      // Завершение игры
      finishPrice = lastPrice;
      chart.finishIndex = 10; // Фиксируем финиш
      chart.options.plugins.annotation.annotations.finishMarker.xMin = 10;
      chart.options.plugins.annotation.annotations.finishMarker.xMax = 10;

      // Определяем победителя
      const result = finishPrice > startPrice ? 'Up' : 'Down';
      resultElement.textContent = `${result} wins!`;
      setTimeout(() => {
        // Сброс
        phase = 'betting';
        timer = 30;
        bets = { up: [], down: [] };
        startPrice = null;
        finishPrice = null;
        chart.startIndex = null;
        chart.finishIndex = null;
        chart.options.plugins.annotation.annotations.startPin.xMin = 0;
        chart.options.plugins.annotation.annotations.finishMarker.xMin = 20;
        resultElement.textContent = '';
      }, 3000); // 3 сек на показ результата
    }
  }
}, 1000);

// Логика ставок
async function placeBet(direction) {
  if (phase !== 'betting' || timer === 0) return;
  const amount = parseFloat(betAmountInput.value);
  if (!amount) return;

  const bet = { amount, userId: webApp.initDataUnsafe.user?.id || 'anonymous' };
  bets[direction.toLowerCase()].push(bet);

  const response = await fetch('/api/place-bet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, direction }),
  });
  const data = await response.json();
  console.log(data); // Для отладки
}

upBtn.addEventListener('click', () => placeBet('Up'));
downBtn.addEventListener('click', () => placeBet('Down'));
