const webApp = window.Telegram.WebApp;
webApp.ready();

const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(60).fill(''), // 60 точек
    datasets: [{
      label: 'BTC/USD',
      data: Array(60).fill(50000), // Начальные значения
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
    animation: false,
    scales: {
      x: {
        display: false, // Скрываем ось X
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#fff', stepSize: 1 }, // Шаг 1 USD
        beginAtZero: false,
      },
    },
    plugins: {
      legend: { labels: { color: '#fff' } },
      tooltip: { enabled: true },
    },
  },
});

// Получаем цену с CoinGecko
async function fetchPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Ошибка API:', error);
    return chart.data.datasets[0].data.slice(-1)[0]; // Последняя цена при ошибке
  }
}

// Обновляем график
async function updateChart() {
  const price = await fetchPrice();
  chart.data.datasets[0].data.shift(); // Убираем старую точку
  chart.data.datasets[0].data.push(price); // Добавляем новую
  chart.update();
}

// Старт и обновление каждую секунду
updateChart();
setInterval(updateChart, 1000);

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
