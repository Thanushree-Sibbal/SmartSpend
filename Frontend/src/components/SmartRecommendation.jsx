import React from "react";

function SmartRecommendation({ transactions }) {

  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((sum,t)=>sum+t.amount,0);

  const expense = transactions
    .filter(t => t.amount < 0)
    .reduce((sum,t)=>sum+t.amount,0);

  const balance = income + expense;

  const savingsTarget = balance * 0.2;

  let message = "Your spending is healthy.";

  if(Math.abs(expense) > income * 0.8){
    message = "You are spending too aggressively. Consider reducing expenses.";
  }

  if(balance < savingsTarget){
    message = "Your savings are below recommended levels.";
  }

  return (
  <div className="recommendation-card-wide">
    <div className="rec-header">
      <div className="rec-title-group">
        <span className="rec-icon">💡</span>
        <h3>Smart Recommendation</h3>
      </div>
      <span className="status-badge">Analysis Complete</span>
    </div>

    <div className="rec-content-grid">
      {/* Current Balance Insight */}
      <div className="rec-box">
        <label>Current Balance</label>
        <p className="rec-value">₹{balance.toLocaleString("en-IN")}</p>
      </div>

      {/* Savings Target Insight */}
      <div className="rec-box highlight">
        <label>Recommended Savings (20%)</label>
        <p className="rec-value">₹{savingsTarget.toFixed(2)}</p>
        <div className="mini-progress-bg">
          <div className="mini-progress-fill" style={{ width: '20%' }}></div>
        </div>
      </div>

      {/* The Dynamic Message */}
      <div className="rec-message-box">
        <label>Financial Health Note</label>
        <p className="health-message">
          {message}
        </p>
      </div>
    </div>
  </div>
);
}

export default SmartRecommendation;