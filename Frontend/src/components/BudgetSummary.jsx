import React, { useEffect, useState } from "react";
import { getAccount } from "../services/api";

function BudgetSummary({ transactions }) {

  const [accountBalance, setAccountBalance] = useState(0);

  useEffect(() => {

    const loadAccount = async () => {

      try {

        const account = await getAccount();

        setAccountBalance(
          Number(account?.balance) || 0
        );

      } catch (error) {

        console.error(
          "Failed to load account:",
          error
        );

        setAccountBalance(0);
      }

    };

    loadAccount();

  }, []);


  // Total income
  const income = transactions
    .filter(t => Number(t.amount) > 0)
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );


  // Total expenses
  const expense = transactions
    .filter(t => Number(t.amount) < 0)
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );


  // IMPORTANT:
  // Use actual backend account balance
  const balance = accountBalance;


  // Savings rules
  const savings = balance * 0.20;

  const reserve = balance * 0.10;

  const spendable =
    Math.max(
      balance - savings - reserve,
      0
    );


  return (

    <div className="recommendation-card-wide">

      {/* LEFT */}
      <div className="rec-stats-section">

        <div className="rec-header">

          <h3 className="rec-title">
            Smart Recommendation
          </h3>

          <span className="rec-badge">
            Healthy Spending
          </span>

        </div>


        <div className="rec-balance-hero">

          <label>
            Current Balance
          </label>

          <h2>
            ₹{balance.toLocaleString("en-IN")}
          </h2>

        </div>


        <div className="rec-mini-grid">

          <div className="rec-pill inc">

            <span>
              Income
            </span>

            <strong>
              ₹{income.toLocaleString("en-IN")}
            </strong>

          </div>


          <div className="rec-pill exp">

            <span>
              Expenses
            </span>

            <strong>
              ₹{Math.abs(expense).toLocaleString("en-IN")}
            </strong>

          </div>

        </div>

      </div>


      {/* DIVIDER */}
      <div className="rec-divider"></div>


      {/* RIGHT */}
      <div className="rec-action-section">

        <div className="rec-allocation-list">

          <div className="rec-alloc-row">

            <div className="alloc-meta">

              <span>
                Recommended Savings (20%)
              </span>

              <strong>
                ₹{savings.toFixed(2)}
              </strong>

            </div>

            <div className="rec-progress">

              <div className="bar-20"></div>

            </div>

          </div>


          <div className="rec-alloc-row">

            <div className="alloc-meta">

              <span>
                Emergency Fund (10%)
              </span>

              <strong>
                ₹{reserve.toFixed(2)}
              </strong>

            </div>

            <div className="rec-progress">

              <div className="bar-10"></div>

            </div>

          </div>

        </div>


        <div className="rec-final-banner">

          <div className="banner-text">

            <label>
              Safe to Spend
            </label>

            <p>
              ₹{spendable.toFixed(2)}
            </p>

          </div>

          <button className="banner-btn">
            Details
          </button>

        </div>

      </div>

    </div>
  );
}

export default BudgetSummary;