import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Link } from "react-router-dom";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import BudgetSummary from "./components/BudgetSummary";
import SmartRecommendation from "./components/SmartRecommendation";
import ChartSection from "./components/ChartSection";
import RestaurantSuggestions from "./components/RestaurantSuggestions";
import UserDashboard from "./components/UserDashboard";
import ProfileMenu from "./components/ProfileMenu";


import Wallet from "./pages/Wallet";
import Contact from "./pages/Contact";

import { getTransactions, addTransaction } from "./services/api";

import "./styles/style.css";
import "./styles/landing.css";

function App() {
  const [user, setUser] = useState(
    localStorage.getItem("userName") || null
  );
  const [transactions, setTransactions] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await getTransactions();
        setTransactions(data);
      } catch (err) {
        console.log("Could not load transactions", err);
      }
    };
    if (user) loadTransactions();
  }, [user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");

    setUser(null);
    setShowLogin(true);
  };

  const handleAdd = async (transaction) => {
    try {
      const data = await addTransaction(transaction);
      setTransactions((prev) => [...prev, data]);
    } catch (err) {
      console.error("Error adding transaction", err);
    }
  };

  const balance = transactions.reduce((total, t) => {
    const amount = Number(t.amount);
    return t.type === "income" ? total + amount : total - amount;
  }, 0);

  return (
    <BrowserRouter>
      {!user ? (
        // Show landing page first, then login when CTA clicked
        showLogin ? (
          <Login setUser={setUser} />
        ) : (
          <LandingPage onGetStarted={() => setShowLogin(true)} />
        )
      ) : (
        <div className="app-wrapper">

          {/* HEADER */}
          <header className="header-sticky">
            <div className="header-content">
              <h1 className="logo">SmartSpend</h1>
              <div className="header-right">
                <nav className="main-nav">
                  <Link to="/" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
                  <Link to="/wallet" onClick={() => setMobileNavOpen(false)}>Wallet</Link>

                  <Link to="/contact" onClick={() => setMobileNavOpen(false)}>Help</Link>
                  <button className="nav-logout" onClick={logout}>Logout</button>
                </nav>
                <ProfileMenu user={user} balance={balance} setUser={setUser} />
                <button
                  className="hamburger-btn"
                  onClick={() => setMobileNavOpen(o => !o)}
                  aria-label="Toggle navigation"
                >
                  <span className={`ham-line ${mobileNavOpen ? "open" : ""}`} />
                  <span className={`ham-line ${mobileNavOpen ? "open" : ""}`} />
                  <span className={`ham-line ${mobileNavOpen ? "open" : ""}`} />
                </button>
              </div>
            </div>
            {/* Mobile nav drawer */}
            {mobileNavOpen && (
              <nav className="mobile-nav-drawer">
                <Link to="/" onClick={() => setMobileNavOpen(false)}>📊 Dashboard</Link>
                <Link to="/wallet" onClick={() => setMobileNavOpen(false)}>💳 Wallet</Link>
                <Link to="/contact" onClick={() => setMobileNavOpen(false)}>❓ Help</Link>
                <button className="nav-logout mobile-logout" onClick={() => { logout(); setMobileNavOpen(false); }}>🚪 Logout</button>
              </nav>
            )}
          </header>

          <Routes>

            {/* MAIN DASHBOARD */}
            <Route
              path="/"
              element={
                <main className="feed-container">

                  <section className="feed-section">
                    <UserDashboard user={user} transactions={transactions} />
                  </section>

                  <section className="feed-section card">
                    <h3 className="section-title">Quick Add Transaction</h3>
                    <TransactionForm addTransaction={handleAdd} />
                  </section>

                  <section className="feed-section">
                    <BudgetSummary transactions={transactions} />
                  </section>

                  <div className="section-divider"></div>

                  <section className="feed-section analytics-grid">

                    <div className="card">
                      <h3 className="section-title">Spending Insights</h3>
                      <ChartSection transactions={transactions} />
                    </div>

                  </section>

                  <section className="feed-section restaurant-section">

                    <div className="card">

                      <h3 className="section-title">
                        🍽️ Restaurants Within Your Budget
                      </h3>

                      <RestaurantSuggestions
                        transactions={transactions}
                      />

                    </div>

                  </section>

                  <div className="section-divider"></div>

                  <section className="feed-section card">
                    <h3 className="section-title">Recent Transactions</h3>
                    <TransactionList transactions={transactions} />
                  </section>

                  <footer className="feed-footer">
                    <p>© 2025 SmartSpend • Made for better budgeting</p>
                  </footer>

                </main>
              }
            />


            <Route path="/wallet" element={<Wallet transactions={transactions} />} />
            <Route path="/contact" element={<Contact />} />

          </Routes>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
