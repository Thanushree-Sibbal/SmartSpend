import React, { useEffect, useState } from "react";
import { getAccount } from "../services/api";

function UserDashboard({ user, transactions }) {

  const [accountBalance, setAccountBalance] = useState(0);

  // Get the balance belonging to the CURRENT logged-in user
  useEffect(() => {

    const loadBalance = async () => {

      try {

        const account = await getAccount();

        setAccountBalance(
          Number(account?.balance) || 0
        );

      } catch (error) {

        console.error(
          "Failed to load account balance:",
          error
        );

        setAccountBalance(0);
      }

    };

    if (user) {
      loadBalance();
    }

  }, [user]);


  // Income from current user's transactions
  const income = transactions
    .filter(t => Number(t.amount) > 0)
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );


  // Expenses from current user's transactions
  const expenses = transactions
    .filter(t => Number(t.amount) < 0)
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );


  // Savings based on CURRENT ACCOUNT BALANCE
  const savings = accountBalance * 0.20;


  return (
    <div className="dashboard-wrapper">

      {/* Greeting */}
      <div className="dashboard-header">

        <h2>
          Welcome back, <span>{user}</span> 👋
        </h2>

        <p>
          Your financial snapshot today
        </p>

      </div>


      <div className="dashboard-grid">

        {/* BALANCE */}
        <div className="stat-card balance-card">

          <div className="stat-header">

            <span className="icon">
              💳
            </span>

            <h4>
              Current Balance
            </h4>

          </div>

          <p className="amounts">

            ₹{accountBalance.toLocaleString("en-IN")}

          </p>

          <div className="stat-foot">

            <span>
              Current account balance
            </span>

          </div>

        </div>


        {/* INCOME */}
        <div className="stat-card income-card">

          <div className="stat-header">

            <span className="icon">
              📈
            </span>

            <h4>
              Total Income
            </h4>

          </div>

          <p className="amount positive">

            ₹{income.toLocaleString("en-IN")}

          </p>

          <div className="stat-foot">

            <span>
              All incoming funds
            </span>

          </div>

        </div>


        {/* EXPENSE */}
        <div className="stat-card expense-card">

          <div className="stat-header">

            <span className="icon">
              📉
            </span>

            <h4>
              Total Expenses
            </h4>

          </div>

          <p className="amount negative">

            ₹{Math.abs(expenses).toLocaleString("en-IN")}

          </p>

          <div className="stat-foot">

            <span>
              Money spent so far
            </span>

          </div>

        </div>


        {/* SAVINGS */}
        <div className="stat-card savings-card">

          <div className="stat-header">

            <span className="icon">
              💰
            </span>

            <h4>
              Suggested Savings
            </h4>

          </div>

          <p className="amount highlight">

            ₹{savings.toLocaleString("en-IN")}

          </p>

          <div className="stat-foot">

            <span>
              Recommended 20% saving rule
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default UserDashboard;