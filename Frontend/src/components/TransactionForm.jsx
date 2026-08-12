import { useState } from "react";

function TransactionForm({ addTransaction }) {

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim() || !amount || Number(amount) <= 0) {
      alert("Please enter a valid description and amount");
      return;
    }

    const numericAmount = Number(amount);

    // Income = positive
    // Expense = negative
    const finalAmount =
      type === "income"
        ? numericAmount
        : -numericAmount;

    addTransaction({
      description: description.trim(),
      amount: finalAmount,
      type: type
    });

    // Reset form
    setDescription("");
    setAmount("");
    setType("expense");
  };

  return (
    <div className="form-card">

      <div className="form-header">
        <h3>💸 Add Transaction</h3>
        <p>Track your income and expenses instantly</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="transaction-form"
      >

        {/* Transaction Type */}
        <div className="input-group">

          <label>Transaction Type</label>

          <div className="transaction-type-toggle">

            <button
              type="button"
              className={`type-btn income-btn ${type === "income" ? "active" : ""
                }`}
              onClick={() => setType("income")}
            >
              <span>＋</span>
              Income
            </button>

            <button
              type="button"
              className={`type-btn expense-btn ${type === "expense" ? "active" : ""
                }`}
              onClick={() => setType("expense")}
            >
              <span>−</span>
              Expense
            </button>

          </div>

        </div>


        {/* Description */}
        <div className="input-group">

          <label>Description</label>

          <div className="input-wrapper">

            <span className="input-icon">📝</span>

            <input
              type="text"
              placeholder={
                type === "income"
                  ? "Salary, Freelance, Bonus..."
                  : "Groceries, Coffee, Shopping..."
              }
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              required
            />

          </div>

        </div>


        {/* Amount */}
        <div className="input-group">

          <label>Amount</label>

          <div className="input-wrapper amount-field">

            <span className="currency">₹</span>

            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              required
            />

          </div>

          <small className="amount-help">

            {type === "income"
              ? "＋ This amount will be added to your balance"
              : "− This amount will be deducted from your balance"}

          </small>

        </div>


        {/* Submit */}
        <button
          type="submit"
          className={`submit-btn ${type === "income"
              ? "income-submit"
              : "expense-submit"
            }`}
        >

          {type === "income"
            ? "＋ Add Income"
            : "− Add Expense"}

        </button>

      </form>

    </div>
  );
}

export default TransactionForm;