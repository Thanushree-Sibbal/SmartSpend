import { useState } from "react";
import SpendingPieChart from "./SpendingPieChart";
import MonthlyChart from "./MonthlyChart";

function ChartSection({ transactions }) {

const [active,setActive] = useState("pie");

return (
  <div className="finance-card chart-container">
    <div className="chart-header">
      <h3 className="card-subtitle">Spending Insights</h3>
      
      {/* Container for side-by-side buttons */}
      <div className="segmented-control">
        <button
          className={`control-btn ${active === "pie" ? "active" : ""}`}
          onClick={() => setActive("pie")}
        >
          Pie Chart
        </button>
        <button
          className={`control-btn ${active === "monthly" ? "active" : ""}`}
          onClick={() => setActive("monthly")}
        >
          Monthly Trend
        </button>
      </div>
    </div>

    <div className="chart-viewport">
      {active === "pie" ? (
        <div className="chart-wrapper animate-fade">
          <SpendingPieChart transactions={transactions} />
        </div>
      ) : (
        <div className="chart-wrapper animate-fade">
           {/* Assuming MonthlyChart contains your <Line /> component */}
          <MonthlyChart transactions={transactions} />
        </div>
      )}
    </div>
  </div>
);
}

export default ChartSection;