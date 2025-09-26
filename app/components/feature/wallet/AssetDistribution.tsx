"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { LoadingSpinner } from "../../ui";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetDistributionProps {
  values: number[];
}

export default function AssetDistribution({ values }: AssetDistributionProps) {
  const labels = values.map((_, idx) => `Wallet${idx + 1}`);
  const baseBgColors = [
    "rgba(255, 99, 132, 0.2)",
    "rgba(54, 162, 235, 0.2)",
    "rgba(75, 192, 192, 0.2)",
    "rgba(153, 102, 255, 0.2)",
    "rgba(255, 159, 64, 0.2)",
    "rgba(255, 206, 86, 0.2)",
  ];
  const baseBorderColors = [
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(255, 206, 86, 1)",
  ];

  const backgroundColor = values.map((_, idx) => baseBgColors[idx % baseBgColors.length]);
  const borderColor = values.map((_, idx) => baseBorderColors[idx % baseBorderColors.length]);

  const data = {
    labels,
    datasets: [
      {
        label: "% of Total",
        data: values,
        backgroundColor,
        borderColor,
        borderWidth: 1,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    cutout: "50%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div className="card flex-grow-1 shadow-sm">
      <div className="card-header">
        <i className="bi bi-bar-chart"></i> Asset Distribution
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-center flex-grow-1" style={{ height: "40vh" }}>
          {values.length === 0 ? (
            <div className="d-flex justify-content-center align-items-center">
              <LoadingSpinner size="md" variant="secondary" />
            </div>
          ) : (
            <Doughnut data={data} options={options} />
          )}
        </div>
      </div>
    </div>
  );
}
