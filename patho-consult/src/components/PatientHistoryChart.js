import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PatientHistoryChart = ({ records }) => {
  // 1. Filter numeric data
  const chartDataPoints = (records || []).filter(r => {
    const val = parseFloat(r.value);
    return !isNaN(val) && val !== null;
  });

  const hasData = chartDataPoints.length > 0;

  const data = {
    // If no data, we provide empty labels to ensure the X-axis grid is drawn
    labels: hasData ? chartDataPoints.map(r => r.date) : ['', '', '', '', ''],
    datasets: [
      {
        label: 'Test Result Trend',
        data: chartDataPoints.map(r => parseFloat(r.value)),
        borderColor: '#4a148c',
        backgroundColor: 'rgba(74, 20, 140, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4, 
        // Only show circles if there is exactly 1 point
        pointRadius: chartDataPoints.length === 1 ? 5 : 0, 
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#4a148c',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: hasData } 
    },
    scales: {
      y: {
        beginAtZero: true,
        // suggestedMax ensures grid lines are drawn even when data is 0 or empty
        suggestedMin: 0,
        suggestedMax: 10, 
        grid: { color: '#f0f0f0' },
        ticks: { color: '#999', font: { size: 10 } },
        title: { 
          display: true, 
          text: 'Measured Value', 
          color: '#4a148c', 
          font: { weight: 'bold', size: 11 } 
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#999', font: { size: 10 } }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#fff' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default PatientHistoryChart;