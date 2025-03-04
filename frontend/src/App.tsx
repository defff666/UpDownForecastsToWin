import React, { useState, useEffect } from 'react';
import { initWebApp } from '@telegram-apps/sdk';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const App: React.FC = () => {
  const [webApp] = useState(initWebApp());
  const [betAmount, setBetAmount] = useState('');
  const [priceData, setPriceData] = useState<number[]>([50000, 50050, 50100]);
  const [timer, setTimer] = useState(60);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    webApp.ready();
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [webApp]);

  const chartData = {
    labels: priceData.map((_, i) => i.toString()),
    datasets: [{
      label: 'BTC Price',
      data: priceData,
      borderColor: '#00ff00',
      backgroundColor: 'rgba(0, 255, 0, 0.1)',
      tension: 0.1,
    }],
  };

  const handleBet = async (direction: 'up' | 'down') => {
    if (!betAmount || timer === 0) return;
    const response = await fetch('YOUR_BACKEND_URL/api/place-bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: betAmount, direction, userId: webApp.initDataUnsafe.user?.id }),
    });
    const data = await response.json();
    setResult(data.result);
  };

  return (
    <div className="app">
      <h1>UpDownForecastsToWin</h1>
      <div className="chart-container">
        <Line data={chartData} options={{ maintainAspectRatio: false }} />
      </div>
      <div className="timer">Time left: {timer}s</div>
      <input
        type="number"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
        placeholder="Enter bet (TON)"
      />
      <div className="buttons">
        <button onClick={() => handleBet('up')} disabled={timer === 0}>Up</button>
        <button onClick={() => handleBet('down')} disabled={timer === 0}>Down</button>
      </div>
      {result && <div className="result">{result}</div>}
    </div>
  );
};

export default App;
