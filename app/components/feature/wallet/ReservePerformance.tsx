"use client";

import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface ReservePerformanceProps {
  values: number[];
}

export default function ReservePerformance({ values }: ReservePerformanceProps) {
  const getLast12Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString("en-US", { month: "short" }));
    }
    return months;
  };
  const labels = getLast12Months();

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: "Crypto Holdings (USD)",
        data: values,
        borderColor: "rgba(38, 201, 155, 1)",
        backgroundColor: "rgba(38, 201, 155, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
        },
      },
      y: {
        ticks: {
          callback: function (tickValue: string | number) {
            return `$${Number(tickValue) / 1000}k`;
          },
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="card flex-grow-1 shadow-sm">
      <div className="card-header">
        <i className="bi bi-speedometer2"></i> Reserve Performance
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-center flex-grow-1" style={{ height: "40vh" }}>
          {
            values.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center">
                <div className="spinner-border text-secondary" style={{ width: "3rem", height: "3rem" }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Line data={data} options={options}/>
            )
          }
        </div>
      </div>
    </div>
  );
}
