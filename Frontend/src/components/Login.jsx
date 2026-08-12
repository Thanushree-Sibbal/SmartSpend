import { useState } from "react";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // ------------------------------------
  // VALIDATE EMAIL
  // ------------------------------------
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ------------------------------------
  // VALIDATE PASSWORD
  // ------------------------------------
  const isValidPassword = (password) => {
    return password.length >= 8;
  };

  // ------------------------------------
  // LOGIN
  // ------------------------------------
  const login = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      alert("Please enter email and password.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!isValidPassword(password)) {
      alert("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://smartspender-itbv.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      const displayName = data.username || "User";

      // SAVE LOGIN DATA
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", displayName);

      // UPDATE APP STATE
      setUser(displayName);

    } catch (err) {
      console.error(err);

      // Don't expose unnecessary backend details
      alert("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------
  // REGISTER
  // ------------------------------------
  const register = async () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanEmail || !password) {
      alert("Please fill all fields.");
      return;
    }

    if (cleanUsername.length < 2) {
      alert("Please enter a valid name.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!isValidPassword(password)) {
      alert("Password must be at least 8 characters.");
      return;
    }

    // Stronger password check for registration
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      alert("Password must contain at least one letter and one number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://smartspender-itbv.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: cleanUsername,
            email: cleanEmail,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("Registration successful! Please login.");

      setIsRegister(false);
      setUsername("");
      setPassword("");

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------
  // SWITCH LOGIN / REGISTER
  // ------------------------------------
  const switchMode = () => {
    setIsRegister(!isRegister);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="center-screen">

      <div className="card">

        <h2>
          {isRegister ? "Join SmartSpend" : "Welcome"}
        </h2>

        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={isRegister ? register : login}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : isRegister
              ? "Create Account"
              : "Login"}
        </button>

        <p>
          {isRegister
            ? "Already have an account?"
            : "New to SmartSpend?"}

          <span
            onClick={switchMode}
            style={{ cursor: "pointer" }}
          >
            {isRegister ? " Login here" : " Create account"}
          </span>
        </p>

      </div>

    </div>
  );
}

export default Login;