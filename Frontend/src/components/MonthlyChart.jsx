import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

function MonthlyChart({ transactions }) {

  const monthly = {};

  transactions.forEach(t => {

    const date = new Date(t.date);
    const month = date.toLocaleString("default",{month:"short"});

    if(!monthly[month]){
      monthly[month] = 0;
    }

    monthly[month] += t.amount;

  });

  const data = {
    labels: Object.keys(monthly),
    datasets: [
      {
        label: "Monthly Balance Flow",
        data: Object.values(monthly),
        borderColor: "#38bdf8",
        backgroundColor: "#38bdf8"
      }
    ]
  };

 return (
  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto overflow-hidden relative">
    {/* Header with quick stats */}
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-xl font-bold text-slate-800">Monthly Trend</h3>
        <p className="text-sm text-slate-500">Visualizing your cash flow over time</p>
      </div>
      <div className="text-right">
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          ↑ 12% vs last month
        </span>
      </div>
    </div>

    {/* The Chart Area */}
    <div className="h-64 w-full relative group">
      {/* Optional: Add a subtle background glow behind the chart */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent rounded-xl -m-2"></div>
      
      <div className="relative h-full">
        <Line 
          data={data} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }, // Hide default legend for a cleaner look
              tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                cornerRadius: 10,
                titleFont: { size: 14 },
              }
            },
            scales: {
              x: { grid: { display: false }, border: { display: false } },
              y: { ticks: { display: false }, grid: { color: '#f1f5f9' }, border: { display: false } }
            }
          }}
        />
      </div>
    </div>

    {/* Footer Info */}
    <div className="mt-4 flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-4">
      <span>Jan 2026</span>
      <span className="font-medium text-slate-500 italic">Updated just now</span>
      <span>Dec 2026</span>
    </div>
  </div>
);
}

export default MonthlyChart;