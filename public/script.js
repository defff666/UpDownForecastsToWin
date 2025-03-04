const webApp = window.Telegram.WebApp;
webApp.ready();

const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'BTC/USD',
      data: [],
      borderColor: '#00ff00',
      backgroundColor: 'rgba(0, 255, 0, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.2,
    }],
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#fff' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#fff', stepSize: 50 },
        beginAtZero: false,
      },
    },
    plugins: {
      legend: { labels: { color: '#fff' } },
      tooltip: { enabled: true },
    },
  },
});

// Загружаем начальные данные
async function fetchPrice() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await response.json();
  return data.bitcoin.usd;
}

// Обновляем график
async function updateChart() {
  const price = await fetchPrice();
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(price);

  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update();
}

// Первичная загрузка и обновление каждые 5 сек
updateChart();
setInterval(updateChart, 5000);

// Таймер
let timer = 60;
const timerElement = document.getElementById('timer');
setInterval(() => {
  if (timer > 0) {
    timer--;
    timerElement.textContent = `Time left: ${timer}s`;
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
