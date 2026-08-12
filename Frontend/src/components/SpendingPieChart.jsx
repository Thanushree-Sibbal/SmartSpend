import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function SpendingPieChart({ transactions }) {

  const expenses = transactions.filter(t => t.amount < 0);

  const categories = {};

  expenses.forEach(t => {
    const category = t.description;
    const amount = Math.abs(t.amount);

    if (!categories[category]) {
      categories[category] = 0;
    }

    categories[category] += amount;
  });

  const data = {
    labels: Object.keys(categories),
    datasets: [
      {
        label: "Spending",
        data: Object.values(categories),
        backgroundColor: [
          "#ef4444",
          "#f97316",
          "#eab308",
          "#22c55e",
          "#06b6d4",
          "#3b82f6",
          "#8b5cf6"
        ]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
  <div className="recommendation-card-wide chart-layout">
    <div className="chart-header-group">
      <h3 className="chart-title-modern">Spending Distribution</h3>
      <p className="chart-subtitle">Where your money went this month</p>
    </div>

    <div className="chart-split-view">
      {/* Left: The Pie Chart */}
      <div className="chart-viz-container">
        <Pie data={data} options={options} />
      </div>

      {/* Right: Custom Legend with Insights */}
      <div className="chart-legend-custom">
        <div className="legend-item">
          <div className="legend-row">
            <span className="dot food"></span>
            <span className="label">Food & Dining</span>
            <span className="percent">45%</span>
          </div>
          <div className="legend-row">
            <span className="dot rent"></span>
            <span className="label">Rent & Bills</span>
            <span className="percent">30%</span>
          </div>
          <div className="legend-row">
            <span className="dot shop"></span>
            <span className="label">Shopping</span>
            <span className="percent">15%</span>
          </div>
          <div className="legend-row">
            <span className="dot other"></span>
            <span className="label">Others</span>
            <span className="percent">10%</span>
          </div>
        </div>
        
        <div className="chart-insight-pill">
          <span>💡 <strong>Food</strong> is your highest expense this month.</span>
        </div>
      </div>
    </div>
  </div>
);
}

export default SpendingPieChart;