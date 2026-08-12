import { useState, useMemo, useEffect } from "react";
import {
  getAccount,
  syncAccountBalance,
  getNearbyPlaces,
  getSavingsGoals,
  createSavingsGoal,
  depositSavingsGoal,
  deleteSavingsGoal,
} from "../services/api";

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fmt = (n) => `₹${Math.abs(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtSigned = (n) => (n >= 0 ? `+${fmt(n)}` : `-${fmt(n)}`);
const CATEGORY_META = {
  food: { icon: "🍵", label: "Food & Chai", color: "#D94F3D", bg: "rgba(217,79,61,0.08)" },
  transport: { icon: "🛺", label: "Transport", color: "#3D7FBF", bg: "rgba(61,127,191,0.08)" },
  shopping: { icon: "🛍", label: "Shopping", color: "#D4860A", bg: "rgba(212,134,10,0.08)" },
  bills: { icon: "📄", label: "Bills", color: "#6B5CF6", bg: "rgba(107,92,246,0.08)" },
  health: { icon: "💊", label: "Health", color: "#2D9E6B", bg: "rgba(45,158,107,0.08)" },
  savings: { icon: "🫙", label: "Savings", color: "#2D9E6B", bg: "rgba(45,158,107,0.08)" },
  other: { icon: "📦", label: "Other", color: "#A8A29E", bg: "rgba(168,162,158,0.08)" },
};

function detectCategory(description = "") {
  const d = description.toLowerCase();
  if (/chai|tea|coffee|food|eat|lunch|dinner|breakfast|snack|mess|canteen|swiggy|zomato/.test(d)) return "food";
  if (/auto|bus|metro|uber|ola|cab|ride|petrol|fuel|train/.test(d)) return "transport";
  if (/shop|amazon|flipkart|cloth|buy|mall|store/.test(d)) return "shopping";
  if (/bill|electricity|wifi|internet|rent|recharge|phone/.test(d)) return "bills";
  if (/medicine|doctor|health|pharmacy|hospital/.test(d)) return "health";
  if (/saving|invest|fd|sip/.test(d)) return "savings";
  return "other";
}

/* ─── SpendRing SVG ─────────────────────────────────────────────── */
function SpendRing({ spent, budget, size = 180 }) {
  const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const r = (size - 24) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const status = pct >= 1 ? "over" : pct >= 0.8 ? "warn" : "ok";
  const ringColor = status === "over" ? "#D94F3D" : status === "warn" ? "#D4860A" : "#2D9E6B";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      {/* track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={12} />
      {/* fill */}
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={ringColor} strokeWidth={12}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease" }}
      />
    </svg>
  );
}

/* ─── Mini sparkline bars ───────────────────────────────────────── */
function SparkBars({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 3,
          background: i === data.length - 1 ? color : `${color}44`,
          height: `${Math.max((v / max) * 100, 6)}%`,
          transition: `height 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Modal wrapper ─────────────────────────────────────────────── */
function Modal({ onClose, children }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(28,25,23,0.52)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.2s ease both",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        padding: "32px 28px", width: "100%", maxWidth: 420,
        boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)",
        animation: "cardIn 0.35s var(--spring) both", position: "relative",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN WALLET COMPONENT
═══════════════════════════════════════════════════════════════════ */
function Wallet({ transactions = [] }) {

  /* ── connected account state ── */
  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  /* ── persisted state ── */
  const [budget, setBudget] = useState(() => parseFloat(localStorage.getItem("ss_budget") || "0"));
  const [walletFunds, setWalletFunds] = useState(0);
  const [walletTxns, setWalletTxns] = useState(() => JSON.parse(localStorage.getItem("ss_wtxns") || "[]"));
  const [savingsGoals, setSavingsGoals] = useState([]);
  /* ── UI state ── */
  const [modal, setModal] = useState(null); // "budget" | "topup" | "goal"
  const [topupAmt, setTopupAmt] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalSaved, setGoalSaved] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // overview | history | goals
  const [toast, setToast] = useState(null);

  /* ── load connected UPI/account balance ── */
  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      try {
        setLoadingAccount(true);

        const data = await getAccount();

        if (!mounted) return;

        setAccount(data);

        // Backend account is now the source of truth.
        setWalletFunds(Number(data?.balance) || 0);

      } catch (error) {
        console.error("Failed to load account:", error);
      } finally {
        if (mounted) setLoadingAccount(false);
      }
    };

    loadAccount();

    return () => {
      mounted = false;
    };
  }, []);
  /* ── load savings goals from backend ── */
  useEffect(() => {
    let mounted = true;

    const loadSavingsGoals = async () => {
      try {
        const data = await getSavingsGoals();

        if (mounted) {
          setSavingsGoals(
            Array.isArray(data) ? data : []
          );
        }

      } catch (error) {
        console.error(
          "Failed to load savings goals:",
          error
        );
      }
    };

    loadSavingsGoals();

    return () => {
      mounted = false;
    };
  }, []);
  /* ── persist on change ── */
  useEffect(() => { localStorage.setItem("ss_budget", budget); }, [budget]);
  useEffect(() => { localStorage.setItem("ss_wallet", walletFunds); }, [walletFunds]);
  useEffect(() => { localStorage.setItem("ss_wtxns", JSON.stringify(walletTxns)); }, [walletTxns]);
  /* ── persist on change ── */
  useEffect(() => { localStorage.setItem("ss_budget", budget); }, [budget]);
  useEffect(() => { localStorage.setItem("ss_wallet", walletFunds); }, [walletFunds]);
  useEffect(() => { localStorage.setItem("ss_wtxns", JSON.stringify(walletTxns)); }, [walletTxns]);
  useEffect(() => { localStorage.setItem("ss_goals", JSON.stringify(savingsGoals)); }, [savingsGoals]);
  /* ── derived numbers from transactions ── */
  const stats = useMemo(() => {

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let totalIncome = 0;
    let totalExpense = 0;

    let monthIncome = 0;
    let monthExpense = 0;

    const catSpend = {};
    const daily = {};

    transactions.forEach(t => {

      const amt = Number(t.amount);
      const d = new Date(t.date);
      const cat = detectCategory(t.description);

      const isIncome = amt > 0;
      const value = Math.abs(amt);

      /* TOTALS */
      if (isIncome) totalIncome += value;
      else totalExpense += value;

      /* MONTHLY */
      if (d.getMonth() === month && d.getFullYear() === year) {

        if (isIncome) monthIncome += value;
        else {
          monthExpense += value;

          catSpend[cat] = (catSpend[cat] || 0) + value;

          const dayKey = d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          });

          daily[dayKey] = (daily[dayKey] || 0) + value;
        }
      }

    });

    const balance = totalIncome - totalExpense;

    const dailyArr = Object.values(daily).slice(-7);

    const avgDaily = dailyArr.length
      ? dailyArr.reduce((a, b) => a + b, 0) / dailyArr.length
      : 0;

    const daysLeft =
      new Date(year, month + 1, 0).getDate() - now.getDate();

    return {
      balance,
      totalIncome,
      totalExpense,
      monthIncome,
      monthExpense,
      catSpend,
      dailyArr,
      avgDaily,
      daysLeft,
      projected: monthExpense + avgDaily * daysLeft,
    };

  }, [transactions]);

  /* ── helpers ── */
  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTopup = async () => {
    const amt = parseFloat(topupAmt);
    if (!amt || amt <= 0) return;

    const currentBalance = Number(account?.balance ?? walletFunds) || 0;
    const newFunds = currentBalance + amt;

    try {
      const result = await syncAccountBalance(newFunds);

      // Update local state only after backend sync succeeds.
      setWalletFunds(newFunds);

      setAccount(prev => ({
        ...(prev || {}),
        balance: Number(result?.balance ?? newFunds),
        lastSyncedAt: result?.lastSyncedAt || new Date().toISOString(),
      }));

      const txn = {
        id: Date.now(),
        type: "income",
        description: topupNote || "Wallet top-up",
        amount: amt,
        date: new Date().toISOString(),
      };

      setWalletTxns(prev => [txn, ...prev]);

      setTopupAmt("");
      setTopupNote("");
      setModal(null);

      showToast(`₹${amt.toLocaleString("en-IN")} added to wallet 💰`);

    } catch (error) {
      console.error("Failed to sync wallet balance:", error);
      showToast("Could not sync wallet balance. Please try again.", "err");
    }
  };

  const handleSetBudget = () => {
    const b = parseFloat(budgetInput);
    if (!b || b <= 0) return;
    setBudget(b);
    setBudgetInput("");
    setModal(null);
    showToast(`Monthly budget set to ${fmt(b)} 🎯`);
  };

  const handleAddGoal = async () => {

    if (!goalName || !goalTarget) return;

    const target = parseFloat(goalTarget);
    const saved = parseFloat(goalSaved) || 0;

    if (!target || target <= 0) {
      showToast("Enter a valid target amount.", "err");
      return;
    }

    try {

      const goal = await createSavingsGoal({
        name: goalName,
        target,
        saved,
        color: [
          "#D94F3D",
          "#2D9E6B",
          "#3D7FBF",
          "#D4860A",
          "#6B5CF6"
        ][savingsGoals.length % 5]
      });

      setSavingsGoals(prev => [
        goal,
        ...prev
      ]);

      setGoalName("");
      setGoalTarget("");
      setGoalSaved("");
      setModal(null);

      showToast(
        `Goal "${goalName}" created 🎉`
      );

    } catch (error) {

      console.error(
        "Failed to create savings goal:",
        error
      );

      showToast(
        "Could not create savings goal.",
        "err"
      );
    }
  };
  const handleGoalDeposit = async (id, amount) => {

    if (!id) {
      showToast("Savings goal ID is missing.", "err");
      return;
    }

    if (!amount || amount <= 0) {
      showToast("Enter a valid deposit amount.", "err");
      return;
    }

    try {

      const result = await depositSavingsGoal(id, amount);

      setSavingsGoals(prev =>
        prev.map(goal =>
          (goal._id || goal.id) === id
            ? result.goal
            : goal
        )
      );

      const newBalance =
        Number(result.balance) || 0;

      setWalletFunds(newBalance);

      setAccount(prev => ({
        ...(prev || {}),
        balance: newBalance,
        lastSyncedAt:
          result?.goal?.updatedAt ||
          new Date().toISOString()
      }));

      showToast("Deposited to goal ✅");

    } catch (error) {

      console.error(
        "Failed to deposit into savings goal:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Could not deposit into savings goal.";

      showToast(message, "err");
    }
  };

  const handleDeleteGoal = async (id) => {

    try {

      await deleteSavingsGoal(id);

      setSavingsGoals(prev =>
        prev.filter(goal =>
          goal._id !== id
        )
      );

      showToast(
        "Savings goal deleted."
      );

    } catch (error) {

      console.error(
        "Failed to delete savings goal:",
        error
      );

      showToast(
        "Could not delete savings goal.",
        "err"
      );
    }
  };

  /* ── SMART BUDGET ENGINE ── */

  const smartBudget = useMemo(() => {

    const currentBalance =
      Number(account?.balance ?? walletFunds) || 0;

    const monthlyBudget =
      Number(budget) || 0;

    const spentThisMonth =
      Number(stats.monthExpense) || 0;

    const remainingBudget = Math.max(
      monthlyBudget - spentThisMonth,
      0
    );

    const daysRemaining = Math.max(
      Number(stats.daysLeft) || 1,
      1
    );

    // Keep 10% of the current UPI balance as an emergency reserve.
    const emergencyReserve = currentBalance * 0.10;

    const balanceAfterReserve = Math.max(
      currentBalance - emergencyReserve,
      0
    );

    // The user can never safely spend more than either limit.
    const safeToSpend = Math.min(
      balanceAfterReserve,
      remainingBudget
    );

    const dailySafeSpend =
      safeToSpend / daysRemaining;

    // Dynamic category allocation.
    const categoryPercentages = {
      food: 0.30,
      transport: 0.15,
      bills: 0.20,
      shopping: 0.10,
      health: 0.10,
      savings: 0.10,
      other: 0.05
    };

    const categoryBudget = {};

    Object.entries(categoryPercentages).forEach(
      ([category, percentage]) => {
        categoryBudget[category] =
          safeToSpend * percentage;
      }
    );

    const spendingPercentage =
      monthlyBudget > 0
        ? (spentThisMonth / monthlyBudget) * 100
        : 0;

    let spendingStatus = "healthy";

    if (spendingPercentage >= 100) {
      spendingStatus = "over";
    } else if (spendingPercentage >= 80) {
      spendingStatus = "warning";
    }

    return {
      currentBalance,
      monthlyBudget,
      spentThisMonth,
      remainingBudget,
      daysRemaining,
      emergencyReserve,
      balanceAfterReserve,
      safeToSpend,
      dailySafeSpend,
      categoryBudget,
      spendingPercentage,
      spendingStatus
    };

  }, [
    account,
    walletFunds,
    budget,
    stats.monthExpense,
    stats.daysLeft
  ]);


  /* ── smart place recommendations ── */
  /* ── smart place recommendations ── */
  useEffect(() => {
    let mounted = true;

    const loadNearbyPlaces = async () => {

      // Food gets 30% of the dynamically calculated safe-to-spend amount.
      const foodBudget =
        Number(smartBudget.categoryBudget?.food) || 0;

      if (foodBudget <= 0) {
        if (mounted) {
          setNearbyPlaces([]);
          setPlacesLoading(false);
        }
        return;
      }

      try {

        setPlacesLoading(true);

        // Get the user's actual browser location
        navigator.geolocation.getCurrentPosition(
          async (position) => {

            if (!mounted) return;

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            try {

              const data = await getNearbyPlaces({
                budget: Math.floor(foodBudget),
                category: "all",
                lat,
                lng
              });

              if (mounted) {
                setNearbyPlaces(
                  Array.isArray(data?.places)
                    ? data.places
                    : []
                );
              }

            } catch (error) {

              console.error(
                "Failed to load nearby places:",
                error
              );

              if (mounted) {
                setNearbyPlaces([]);
              }

            } finally {

              if (mounted) {
                setPlacesLoading(false);
              }

            }

          },

          (error) => {

            console.error(
              "Location permission/error:",
              error
            );

            if (mounted) {
              setNearbyPlaces([]);
              setPlacesLoading(false);
            }

          },

          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );

      } catch (error) {

        console.error(
          "Nearby places error:",
          error
        );

        if (mounted) {
          setNearbyPlaces([]);
          setPlacesLoading(false);
        }

      }
    };

    loadNearbyPlaces();

    return () => {
      mounted = false;
    };

  }, [
    smartBudget.categoryBudget?.food
  ]);


  const budgetPct = budget > 0 ? Math.min(stats.monthExpense / budget, 1) : 0;
  const budgetStatus = budgetPct >= 1 ? "over" : budgetPct >= 0.8 ? "warn" : "ok";
  const statusMeta = {
    ok: { color: "#2D9E6B", bg: "var(--green-soft)", border: "var(--green-border)", label: "On Track 🟢" },
    warn: { color: "#D4860A", bg: "var(--amber-soft)", border: "rgba(212,134,10,0.22)", label: "Careful ⚠️" },
    over: { color: "#D94F3D", bg: "var(--ember-soft)", border: "var(--ember-border)", label: "Over Budget 🔴" },
  };
  const sm = statusMeta[budgetStatus];

  /* sort cat spend for chart */
  const catEntries = Object.entries(stats.catSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const catMax = catEntries[0]?.[1] || 1;
  /* ── SMART SPENDING ALERTS ── */

  const smartAlerts = useMemo(() => {

    const alerts = [];

    const balance = smartBudget.currentBalance;
    const spent = smartBudget.spentThisMonth;
    const monthlyBudget = smartBudget.monthlyBudget;
    const dailySafe = smartBudget.dailySafeSpend;
    const avgDaily = Number(stats.avgDaily) || 0;

    // 1. Budget exceeded
    if (monthlyBudget > 0 && spent >= monthlyBudget) {
      alerts.push({
        type: "danger",
        icon: "🚨",
        title: "Budget exceeded",
        message: `You've spent ${fmt(spent)} against your ${fmt(monthlyBudget)} monthly budget.`
      });
    }

    // 2. 80% budget warning
    else if (
      monthlyBudget > 0 &&
      spent / monthlyBudget >= 0.8
    ) {
      alerts.push({
        type: "warning",
        icon: "⚠️",
        title: "Budget almost used",
        message: `You've used ${Math.round((spent / monthlyBudget) * 100)}% of your monthly budget.`
      });
    }

    // 3. Daily spending is above safe level
    if (
      dailySafe > 0 &&
      avgDaily > dailySafe
    ) {
      alerts.push({
        type: "warning",
        icon: "📈",
        title: "Spending faster than planned",
        message: `Your recent average is ${fmt(avgDaily)}/day, above your safe ${fmt(dailySafe)}/day limit.`
      });
    }

    // 4. Low balance
    if (
      balance > 0 &&
      monthlyBudget > 0 &&
      balance < monthlyBudget * 0.25
    ) {
      alerts.push({
        type: "danger",
        icon: "💳",
        title: "Low wallet balance",
        message: `Your connected UPI balance is down to ${fmt(balance)}.`
      });
    }

    // 5. Healthy status
    if (alerts.length === 0) {
      alerts.push({
        type: "success",
        icon: "✅",
        title: "You're on track",
        message: `You have ${fmt(smartBudget.safeToSpend)} safely available within your current budget.`
      });
    }

    return alerts;

  }, [
    smartBudget,
    stats.avgDaily
  ]);
  return (
    <div className="page-container" style={{ maxWidth: 980, position: "relative" }}>

      {/* ── TOAST ──────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "err" ? "var(--ember)" : "var(--ink)",
          color: "#fff", padding: "12px 20px", borderRadius: "var(--r-md)",
          fontSize: 13, fontWeight: 600, boxShadow: "var(--shadow-lg)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "slideLeft 0.4s var(--spring) both",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: "#3DBE80",
            flexShrink: 0, boxShadow: "0 0 0 3px rgba(61,190,128,0.25)",
          }} />
          {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER ────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>👛</span> My Wallet
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Manage funds, set your budget, track spending goals
            {account && (
              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--green)", fontWeight: 700 }}>
                ● {account.connectionStatus === "demo" ? "UPI demo connected" : "Account connected"}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setModal("topup")} style={{
            background: "linear-gradient(135deg, var(--green) 0%, #1E8A5A 100%)",
            color: "#fff", border: "none", padding: "10px 20px",
            borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
            boxShadow: "0 4px 16px rgba(45,158,107,0.28)",
            transition: "transform 0.2s var(--spring), box-shadow 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = ""}
          >
            <span style={{ fontSize: 16 }}>＋</span> Add Money
          </button>
          <button onClick={() => { setBudgetInput(budget || ""); setModal("budget"); }} style={{
            background: "var(--surface)", color: "var(--ink)",
            border: "1.5px solid var(--border)", padding: "10px 20px",
            borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
            transition: "border-color 0.2s, transform 0.2s var(--spring)",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ember-border)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 15 }}>🎯</span> Set Budget
          </button>
        </div>
      </div>

      {/* ── HERO STRIP ─────────────────────────────────── */}
      <div className="wallet-hero" style={{ marginBottom: 22, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0 }}>

            {/* Available in wallet */}
            <div style={{ padding: "0 24px 0 0", borderRight: "1px solid rgba(255,255,255,0.10)" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, display: "block", marginBottom: 6 }}>
                Wallet Balance
              </label>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, letterSpacing: -2, lineHeight: 1, marginBottom: 6 }}>
                {loadingAccount ? "…" : fmt(account?.balance ?? walletFunds)}
              </div>
              <div style={{ fontSize: 11, opacity: 0.55 }}>
                Connected UPI balance
              </div>
            </div>

            {/* Overall balance */}
            <div style={{ padding: "0 24px", borderRight: "1px solid rgba(255,255,255,0.10)" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, display: "block", marginBottom: 6 }}>
                Safe to Spend
              </label>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, letterSpacing: -2, lineHeight: 1, marginBottom: 6, color: stats.balance >= 0 ? "#3DBE80" : "#FF7060" }}>
                {loadingAccount ? "…" : fmt(smartBudget.safeToSpend)}
              </div>
              <div style={{ fontSize: 11, opacity: 0.55 }}>
                After budget allocation
              </div>
            </div>

            {/* This month spent */}
            <div style={{ padding: "0 24px", borderRight: "1px solid rgba(255,255,255,0.10)" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, display: "block", marginBottom: 6 }}>
                Spent This Month
              </label>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, letterSpacing: -2, lineHeight: 1, marginBottom: 6, color: "#FF8060" }}>
                {fmt(stats.monthExpense)}
              </div>
              <div style={{ fontSize: 11, opacity: 0.55 }}>
                {stats.daysLeft} days remaining
              </div>
            </div>

            {/* Monthly budget */}
            <div style={{ padding: "0 0 0 24px" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, display: "block", marginBottom: 6 }}>
                Monthly Budget
              </label>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, letterSpacing: -2, lineHeight: 1, marginBottom: 6 }}>
                {budget > 0 ? fmt(budget) : "—"}
              </div>
              <div style={{ fontSize: 11, opacity: 0.55 }}>
                {budget > 0
                  ? `${Math.round(budgetPct * 100)}% used`
                  : <span onClick={() => setModal("budget")} style={{ cursor: "pointer", textDecoration: "underline" }}>Tap to set →</span>
                }
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* ── SMART ALERTS ─────────────────────────────── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 22,
      }}>
        {smartAlerts.map((alert, index) => {

          const alertStyles = {
            success: {
              background: "var(--green-soft)",
              border: "var(--green-border)",
              color: "var(--green)",
            },
            warning: {
              background: "var(--amber-soft)",
              border: "rgba(212,134,10,0.22)",
              color: "var(--amber)",
            },
            danger: {
              background: "var(--ember-soft)",
              border: "var(--ember-border)",
              color: "var(--ember)",
            },
          };

          const style =
            alertStyles[alert.type] || alertStyles.success;

          return (
            <div
              key={`${alert.type}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: style.background,
                border: `1px solid ${style.border}`,
                borderRadius: "var(--r-md)",
              }}
            >

              <span style={{
                fontSize: 18,
                flexShrink: 0,
              }}>
                {alert.icon}
              </span>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: style.color,
                  marginBottom: 2,
                }}>
                  {alert.title}
                </div>

                <div style={{
                  fontSize: 11.5,
                  color: "var(--muted)",
                }}>
                  {alert.message}
                </div>
              </div>

            </div>
          );
        })}
      </div>
      {/* ── TABS ───────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "var(--surface-inset)", padding: 4, borderRadius: "var(--r-md)", border: "1px solid var(--border)", width: "fit-content" }}>
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "history", label: "Wallet History", icon: "📋" },
          { id: "goals", label: "Goals", icon: "🎯" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "var(--surface)" : "transparent",
            color: activeTab === tab.id ? "var(--ember)" : "var(--muted)",
            border: "none", padding: "8px 18px", borderRadius: "var(--r-sm)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: activeTab === tab.id ? "var(--shadow-xs)" : "none",
            transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6,
            transform: "none",
          }}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          {/* ── Budget Ring Card ── */}
          <div className="wallet-stat" style={{ padding: "24px", display: "flex", gap: 24, alignItems: "center", gridColumn: budget > 0 ? "auto" : "1/-1" }}>
            {budget > 0 ? (
              <>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <SpendRing spent={stats.monthExpense} budget={budget} size={150} />
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)", textAlign: "center",
                  }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, lineHeight: 1, color: "var(--ink)", letterSpacing: -1 }}>
                      {Math.round(budgetPct * 100)}%
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>used</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: sm.bg, border: `1px solid ${sm.border}`,
                    color: sm.color, padding: "4px 12px", borderRadius: "var(--r-full)",
                    fontSize: 11, fontWeight: 700, marginBottom: 14,
                  }}>
                    {sm.label}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
                    Budget Tracker
                  </h3>
                  {[
                    { label: "Spent", val: fmt(stats.monthExpense), color: "var(--ember)" },
                    { label: "Budget", val: fmt(budget), color: "var(--ink)" },
                    { label: "Remaining", val: fmt(Math.max(budget - stats.monthExpense, 0)), color: "var(--green)" },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: row.color, letterSpacing: -0.3 }}>{row.val}</span>
                    </div>
                  ))}
                  <button onClick={() => { setBudgetInput(budget); setModal("budget"); }} style={{
                    marginTop: 14, background: "transparent", color: "var(--ember)",
                    border: "1.5px solid var(--ember-border)", padding: "7px 16px",
                    borderRadius: "var(--r-sm)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "background 0.2s, transform 0.2s var(--spring)",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--ember-soft)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    ✏️ Edit Budget
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", width: "100%" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
                  No budget set yet
                </h3>
                <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
                  Set a monthly budget to track how much you're spending
                </p>
                <button onClick={() => setModal("budget")} style={{
                  background: "linear-gradient(135deg, var(--ember), var(--ember-deep))",
                  color: "#fff", border: "none", padding: "11px 24px",
                  borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: "var(--shadow-ember)",
                }}>
                  🎯 Set Monthly Budget
                </button>
              </div>
            )}
          </div>

          {/* ── Daily Spending Sparkline ── */}
          <div className="wallet-stat" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em" }}>
                  Daily Spending
                </h3>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "3px 0 0" }}>Last 7 days</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--ink)", letterSpacing: -0.5 }}>
                  {fmt(stats.avgDaily)}<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>/day</span>
                </div>
              </div>
            </div>
            {stats.dailyArr.length > 0 ? (
              <SparkBars data={stats.dailyArr} color="var(--ember)" />
            ) : (
              <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
                No spending data yet
              </div>
            )}
            <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--surface-inset)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Projected month-end spend
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: stats.projected > budget && budget > 0 ? "var(--ember)" : "var(--green)", letterSpacing: -0.5 }}>
                {fmt(stats.projected)}
              </div>
            </div>
          </div>

          {/* ── Category Breakdown ── */}
          <div className="wallet-stat" style={{ padding: 24, gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em" }}>
                  Spending by Category
                </h3>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "3px 0 0" }}>This month's breakdown</p>
              </div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ember)",
                background: "var(--ember-soft)", border: "1px solid var(--ember-border)",
                padding: "4px 12px", borderRadius: "var(--r-full)",
              }}>
                {fmt(stats.monthExpense)} total
              </div>
            </div>

            {catEntries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {catEntries.map(([cat, amt]) => {
                  const meta = CATEGORY_META[cat] || CATEGORY_META.other;
                  const pct = amt / catMax;
                  const budgetShare = budget > 0 ? (amt / budget) * 100 : null;

                  const categoryKeyMap = {
                    food: "food",
                    transport: "transport",
                    bills: "bills",
                    shopping: "shopping",
                    health: "health",
                    savings: "savings",
                    other: "other",
                  };

                  const categoryKey =
                    categoryKeyMap[String(cat).toLowerCase()] ||
                    String(cat).toLowerCase();

                  const allocated =
                    smartBudget.categoryBudget?.[categoryKey] || 0;

                  const remaining = Math.max(allocated - amt, 0);

                  return (
                    <div
                      key={cat}
                      style={{
                        padding: "13px 16px",
                        borderRadius: "var(--r-md)",
                        background: "var(--surface-inset)",
                        border: "1px solid var(--border)",
                        transition: "transform 0.2s var(--spring), border-color 0.2s",
                        cursor: "default",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.borderColor = meta.color + "44";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10
                        }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: "var(--r-sm)",
                            background: meta.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                          }}>
                            {meta.icon}
                          </div>

                          <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--ink)"
                          }}>
                            {meta.label}
                          </span>
                        </div>

                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12
                        }}>
                          {budgetShare !== null && (
                            <span style={{
                              fontSize: 11,
                              color: "var(--muted)"
                            }}>
                              {budgetShare.toFixed(0)}% of budget
                            </span>
                          )}

                          <span style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 14,
                            color: "var(--ink)",
                            letterSpacing: -0.3
                          }}>
                            {fmt(amt)}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        height: 5,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-full)",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          height: "100%",
                          borderRadius: "var(--r-full)",
                          width: `${pct * 100}%`,
                          background: meta.color,
                          transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                          position: "relative",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 2s linear infinite",
                          }} />
                        </div>
                      </div>

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 9,
                        fontSize: 11
                      }}>
                        <span style={{ color: "var(--muted)" }}>
                          Allocated:{" "}
                          <strong style={{
                            color: "var(--ink)",
                            fontFamily: "var(--font-mono)"
                          }}>
                            {fmt(allocated)}
                          </strong>
                        </span>

                        <span style={{
                          color: remaining > 0
                            ? "var(--green)"
                            : "var(--ember)"
                        }}>
                          {remaining > 0
                            ? `${fmt(remaining)} remaining`
                            : "Allocation used"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "32px 0",
                color: "var(--muted)",
                fontSize: 13
              }}>
                📊 No spending data this month yet
              </div>
            )}
          </div>
          {/* ── SMART PLACE RECOMMENDATIONS ── */}

          <div
            className="wallet-stat"
            style={{
              padding: 24,
              gridColumn: "1 / -1",
              marginTop: 2
            }}
          >

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18
            }}>

              <div>

                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--ink)",
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}>
                  Places You Can Afford 🍴
                </h3>

                <p style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  margin: "3px 0 0"
                }}>
                  Based on your current safe-to-spend amount
                </p>

              </div>

              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--green)",
                background: "var(--green-soft)",
                border: "1px solid var(--green-border)",
                padding: "4px 12px",
                borderRadius: "var(--r-full)"
              }}>
                {fmt(smartBudget.categoryBudget?.food || 0)} food budget
              </div>

            </div>


            {placesLoading ? (

              <div style={{
                textAlign: "center",
                padding: "30px 0",
                color: "var(--muted)",
                fontSize: 12
              }}>
                🔎 Finding places within your budget...
              </div>

            ) : nearbyPlaces.length > 0 ? (

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12
              }}>

                {nearbyPlaces.slice(0, 6).map((place) => (

                  <div
                    key={place.name}
                    style={{
                      padding: 16,
                      borderRadius: "var(--r-md)",
                      background: "var(--surface-inset)",
                      border: "1px solid var(--border)"
                    }}
                  >

                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10
                    }}>

                      <div style={{
                        fontSize: 22
                      }}>
                        {place.category === "cafe"
                          ? "☕"
                          : "🍴"}
                      </div>

                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--green)",
                        background: "var(--green-soft)",
                        padding: "3px 7px",
                        borderRadius: "var(--r-full)"
                      }}>
                        ✓ Fits budget
                      </span>

                    </div>

                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--ink)",
                      marginBottom: 4
                    }}>
                      {place.name}
                    </div>

                    <div style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginBottom: 10
                    }}>
                      {place.cuisine} · {place.distance}
                    </div>

                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>

                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        color: "var(--ink)"
                      }}>
                        ~{fmt(place.estimatedCost)}
                      </span>

                      <span style={{
                        fontSize: 11,
                        color: "var(--green)"
                      }}>
                        OpenStreetMap
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div style={{
                textAlign: "center",
                padding: "30px 0",
                color: "var(--muted)",
                fontSize: 12
              }}>
                😕 No places found within today's safe spending limit.
              </div>

            )}

          </div>
          {/* ── Quick Stats Row ── */}
          {[
            { icon: "💰", label: "Total Income", val: fmt(stats.totalIncome), color: "var(--green)", bg: "var(--green-soft)", border: "var(--green-border)" },
            { icon: "💸", label: "Total Expenses", val: fmt(stats.totalExpense), color: "var(--ember)", bg: "var(--ember-soft)", border: "var(--ember-border)" },
            { icon: "📅", label: "Monthly Earned", val: fmt(stats.monthIncome), color: "var(--sky)", bg: "var(--sky-soft)", border: "var(--sky-border)" },
            { icon: "⚡", label: "Avg Daily Spend", val: fmt(stats.avgDaily), color: "var(--amber)", bg: "var(--amber-soft)", border: "rgba(212,134,10,0.22)" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: "var(--r-lg)", padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
              transition: "transform 0.2s var(--spring)",
              cursor: "default",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              <div style={{ fontSize: 26 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: s.color, opacity: 0.75, marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: -0.8, color: s.color }}>
                  {s.val}
                </div>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: WALLET HISTORY
      ══════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", margin: 0 }}>
                Wallet Top-up History
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 3 }}>
                Every time you added money to your wallet
              </p>
            </div>
            <div style={{
              background: "var(--surface-inset)", border: "1px solid var(--border)",
              padding: "6px 14px", borderRadius: "var(--r-full)",
              fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)",
            }}>
              Total: {loadingAccount ? "…" : fmt(account?.balance ?? walletFunds)}
            </div>
          </div>

          {walletTxns.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {walletTxns.map((t, i) => (
                <div key={t.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)", padding: "14px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  animation: `fadeUp 0.4s var(--ease-out) ${i * 0.05}s both`,
                  transition: "border-color 0.2s, transform 0.2s var(--spring)",
                  cursor: "default",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(45,158,107,0.25)"; e.currentTarget.style.transform = "translateX(3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "var(--green-soft)", border: "1px solid var(--green-border)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                    }}>
                      💰
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{t.note}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                        {new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--green)", letterSpacing: -0.5, fontWeight: 400 }}>
                    +{fmt(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "64px 24px",
              background: "var(--surface)", border: "1px dashed var(--border)",
              borderRadius: "var(--r-xl)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                Wallet is empty
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
                Add money to your wallet using the "Add Money" button
              </p>
              <button onClick={() => setModal("topup")} style={{
                background: "linear-gradient(135deg, var(--green), #1E8A5A)",
                color: "#fff", border: "none", padding: "10px 22px",
                borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                ＋ Add Money Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: SAVINGS GOALS
      ══════════════════════════════════════════════════ */}
      {activeTab === "goals" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", margin: 0 }}>
                Savings Goals 🫙
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 3 }}>
                Set a goal, save towards it from your wallet
              </p>
            </div>
            <button onClick={() => setModal("goal")} style={{
              background: "linear-gradient(135deg, var(--sky), #2C5F9E)",
              color: "#fff", border: "none", padding: "10px 20px",
              borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              boxShadow: "0 4px 16px rgba(61,127,191,0.28)",
            }}>
              <span>＋</span> New Goal
            </button>
          </div>

          {savingsGoals.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {savingsGoals.map((goal, i) => {
                const pct = Math.min(goal.saved / goal.target, 1);
                const rem = goal.target - goal.saved;
                const done = pct >= 1;
                const [dep, setDep] = [0, () => { }]; // placeholder; real state per goal below

                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    pct={pct}
                    rem={rem}
                    done={done}
                    walletFunds={walletFunds}
                    onDeposit={handleGoalDeposit}
                    onDelete={handleDeleteGoal}
                    idx={i}
                  />
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "64px 24px",
              background: "var(--surface)", border: "1px dashed var(--border)",
              borderRadius: "var(--r-xl)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                No goals yet
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
                Create a savings goal — trip to Goa, new phone, emergency fund...
              </p>
              <button onClick={() => setModal("goal")} style={{
                background: "linear-gradient(135deg, var(--sky), #2C5F9E)",
                color: "#fff", border: "none", padding: "10px 22px",
                borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                ＋ Create First Goal
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ MODALS ════════════════════ */}

      {/* TOP-UP MODAL */}
      {modal === "topup" && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>💰</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.04em", margin: 0 }}>
              Add Money to Wallet
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
              Current balance: {loadingAccount ? "…" : fmt(account?.balance ?? walletFunds)}
            </p>
          </div>

          {/* Quick amounts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[500, 1000, 2000, 5000, 10000, 20000].map(amt => (
              <button key={amt} onClick={() => setTopupAmt(String(amt))} style={{
                background: topupAmt === String(amt) ? "var(--green-soft)" : "var(--surface-inset)",
                border: `1.5px solid ${topupAmt === String(amt) ? "var(--green-border)" : "var(--border)"}`,
                color: topupAmt === String(amt) ? "var(--green)" : "var(--ink-3)",
                padding: "9px 6px", borderRadius: "var(--r-sm)",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.18s ease",
              }}>
                {fmt(amt)}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: 16, pointerEvents: "none" }}>₹</span>
            <input
              type="number" placeholder="Or enter custom amount"
              value={topupAmt} onChange={e => setTopupAmt(e.target.value)}
              style={{ paddingLeft: 36, margin: 0, fontSize: 16, fontFamily: "var(--font-mono)" }}
            />
          </div>
          <input
            placeholder="Note (optional) — e.g. Pocket money"
            value={topupNote} onChange={e => setTopupNote(e.target.value)}
            style={{ marginBottom: 20 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setModal(null)} style={{
              flex: 1, background: "var(--surface-inset)", color: "var(--ink-3)",
              border: "1.5px solid var(--border)",
            }}>
              Cancel
            </button>
            <button onClick={handleTopup} style={{
              flex: 2, background: "linear-gradient(135deg, var(--green), #1E8A5A)",
              boxShadow: "0 4px 16px rgba(45,158,107,0.28)",
            }}>
              Add {topupAmt ? fmt(parseFloat(topupAmt) || 0) : "Money"} →
            </button>
          </div>
        </Modal>
      )}

      {/* BUDGET MODAL */}
      {modal === "budget" && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎯</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.04em", margin: 0 }}>
              Set Monthly Budget
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
              How much do you want to spend this month?
            </p>
          </div>

          {/* Budget presets */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[3000, 5000, 8000, 10000, 15000, 20000].map(b => (
              <button key={b} onClick={() => setBudgetInput(String(b))} style={{
                background: budgetInput === String(b) ? "var(--ember-soft)" : "var(--surface-inset)",
                border: `1.5px solid ${budgetInput === String(b) ? "var(--ember-border)" : "var(--border)"}`,
                color: budgetInput === String(b) ? "var(--ember)" : "var(--ink-3)",
                padding: "9px 6px", borderRadius: "var(--r-sm)",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.18s ease",
              }}>
                {fmt(b)}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", marginBottom: 20 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: 16, pointerEvents: "none" }}>₹</span>
            <input
              type="number" placeholder="Or enter custom budget"
              value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
              style={{ paddingLeft: 36, margin: 0, fontSize: 16, fontFamily: "var(--font-mono)" }}
            />
          </div>

          {budgetInput && parseFloat(budgetInput) > 0 && (
            <div style={{
              background: "var(--ember-soft)", border: "1px solid var(--ember-border)",
              borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "var(--ember)",
            }}>
              That's <strong>{fmt(parseFloat(budgetInput) / 30)}</strong> per day to stay on track
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setModal(null)} style={{
              flex: 1, background: "var(--surface-inset)", color: "var(--ink-3)",
              border: "1.5px solid var(--border)",
            }}>
              Cancel
            </button>
            <button onClick={handleSetBudget} style={{
              flex: 2, background: "linear-gradient(135deg, var(--ember), var(--ember-deep))",
              boxShadow: "var(--shadow-ember)",
            }}>
              Save Budget →
            </button>
          </div>
        </Modal>
      )}

      {/* NEW GOAL MODAL */}
      {modal === "goal" && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🫙</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.04em", margin: 0 }}>
              New Savings Goal
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
              Name it. Target it. Hit it.
            </p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--muted)", marginBottom: 6 }}>
              Goal Name
            </label>
            <input placeholder="e.g. Trip to Goa 🏖, New Phone 📱"
              value={goalName} onChange={e => setGoalName(e.target.value)} style={{ margin: 0 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--muted)", marginBottom: 6 }}>
              Target Amount
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", color: "var(--muted)", pointerEvents: "none" }}>₹</span>
              <input type="number" placeholder="10000"
                value={goalTarget} onChange={e => setGoalTarget(e.target.value)}
                style={{ paddingLeft: 32, margin: 0 }} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--muted)", marginBottom: 6 }}>
              Already saved (optional)
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", color: "var(--muted)", pointerEvents: "none" }}>₹</span>
              <input type="number" placeholder="0"
                value={goalSaved} onChange={e => setGoalSaved(e.target.value)}
                style={{ paddingLeft: 32, margin: 0 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setModal(null)} style={{
              flex: 1, background: "var(--surface-inset)", color: "var(--ink-3)",
              border: "1.5px solid var(--border)",
            }}>
              Cancel
            </button>
            <button onClick={handleAddGoal} style={{
              flex: 2, background: "linear-gradient(135deg, var(--sky), #2C5F9E)",
              boxShadow: "0 4px 16px rgba(61,127,191,0.28)",
            }}>
              Create Goal →
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}

/* ─── Goal Card sub-component (needs its own state for deposit input) ── */
function GoalCard({ goal, pct, rem, done, walletFunds, onDeposit, onDelete, idx }) {
  const [depAmt, setDepAmt] = useState("");
  const [showDep, setShowDep] = useState(false);

  const handleDeposit = () => {
    const amt = parseFloat(depAmt);
    if (!amt || amt <= 0) return;

    if (amt > walletFunds) {
      return;
    }
    onDeposit(goal._id || goal.id, amt);
    setDepAmt(""); setShowDep(false);
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--r-xl)", padding: 22, position: "relative",
      animation: `cardIn 0.5s var(--ease-out) ${idx * 0.08}s both`,
      transition: "box-shadow 0.25s, transform 0.25s var(--spring)",
      overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
    >
      {/* Colour accent strip */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: done ? "#2D9E6B" : goal.color, borderRadius: "var(--r-xl) var(--r-xl) 0 0" }} />

      {done && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "var(--green-soft)", border: "1px solid var(--green-border)",
          color: "var(--green)", fontSize: 10, fontWeight: 700,
          padding: "3px 10px", borderRadius: "var(--r-full)",
        }}>
          ✅ Completed!
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, marginTop: 8 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
          {goal.name}
        </h3>
        <button onClick={() => onDelete(goal._id || goal.id)} style={{
          background: "transparent", color: "var(--muted)", border: "none",
          padding: "2px 6px", borderRadius: "var(--r-xs)", fontSize: 16,
          cursor: "pointer", lineHeight: 1,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--ember)"; e.currentTarget.style.background = "var(--ember-soft)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
        >
          ×
        </button>
      </div>

      {/* Ring + numbers */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <SpendRing spent={goal.saved} budget={goal.target} size={88} />
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink)", letterSpacing: -0.5 }}>
              {Math.round(pct * 100)}%
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Saved</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: goal.color, letterSpacing: -0.3 }}>{fmt(goal.saved)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Target</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)", letterSpacing: -0.3 }}>{fmt(goal.target)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Remaining</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-3)", letterSpacing: -0.3 }}>{fmt(rem)}</span>
          </div>
        </div>
      </div>

      {/* Deposit section */}
      {!done && (
        showDep ? (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: 13, pointerEvents: "none" }}>₹</span>
              <input type="number" placeholder="Amount"
                value={depAmt} onChange={e => setDepAmt(e.target.value)}
                autoFocus
                style={{ paddingLeft: 28, margin: 0, height: 38, fontSize: 13 }} />
            </div>
            <button onClick={handleDeposit} style={{
              background: "linear-gradient(135deg, var(--green), #1E8A5A)",
              color: "#fff", border: "none", padding: "0 14px",
              borderRadius: "var(--r-sm)", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>
              Add
            </button>
            <button onClick={() => setShowDep(false)} style={{
              background: "var(--surface-inset)", color: "var(--muted)", border: "1px solid var(--border)",
              padding: "0 10px", borderRadius: "var(--r-sm)", fontSize: 13, cursor: "pointer", flexShrink: 0,
            }}>
              ×
            </button>
          </div>
        ) : (
          <button onClick={() => setShowDep(true)} style={{
            width: "100%", background: "var(--surface-inset)",
            color: "var(--ink-3)", border: "1.5px dashed var(--border)",
            padding: "9px", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s, background 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = goal.color; e.currentTarget.style.color = goal.color; e.currentTarget.style.background = `${goal.color}10`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "var(--surface-inset)"; }}
          >
            + Deposit from Wallet
          </button>
        )
      )}
    </div>
  );
}

export default Wallet;