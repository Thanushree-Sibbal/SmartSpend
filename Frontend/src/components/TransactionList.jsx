function TransactionList({ transactions }) {

if(!transactions || transactions.length === 0){
return <p>No transactions yet</p>
}

return (
  <div className="table-container">
    <table className="transaction-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t._id} className="table-row">
            <td className="desc-cell">
              <div className="desc-content">
                <span className={`type-dot ${t.amount > 0 ? "bg-in" : "bg-out"}`}></span>
                {t.description}
              </div>
            </td>
            <td>
              <span className={`amount-pill ${t.amount > 0 ? "pos" : "neg"}`}>
                {t.amount > 0 ? "+" : "-"} ₹{Math.abs(t.amount).toLocaleString("en-IN")}
              </span>
            </td>
            <td className="date-cell">
              {new Date(t.date).toLocaleDateString("en-IN", {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

}

export default TransactionList