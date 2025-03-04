const webApp = window.Telegram.WebApp;
webApp.ready();

const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['0', '1', '2'],
    datasets: [{
      label: 'BTC Price',
      data: [50000, 50050, 50100],
      borderColor: '#00ff00',
      backgroundColor: 'rgba(0, 255, 0, 0.1)',
      tension: 0.1,
    }],
  },
  options: { maintainAspectRatio: false, scales: { y: { beginAtZero: false } } },
});

let timer = 60;
const timerElement = document.getElementById('timer');
setInterval(() => {
  if (timer > 0) {
    timer--;
    timerElement.textContent = `Time left: ${timer}s`;
  }
}, 1000);

// Обновление графика (простое, без API пока)
setInterval(() => {
  const newPrice = chart.data.datasets[0].data.slice(-1)[0] + (Math.random() - 0.5) * 100;
  chart.data.datasets[0].data.push(newPrice);
  chart.data.labels.push('');
  if (chart.data.datasets[0].data.length > 10) {
    chart.data.datasets[0].data.shift();
    chart.data.labels.shift();
  }
  chart.update();
}, 5000);

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
