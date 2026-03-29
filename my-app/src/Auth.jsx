import { useState } from "react";

const API = "http://localhost:8000";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", nuid: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setError("");

    if (!form.email || !form.password) return setError("Please fill in all fields.");
    if (!form.email.endsWith("@northeastern.edu")) return setError("Must use your @northeastern.edu email.");

    if (mode === "signup") {
      if (!form.name.trim()) return setError("Name is required.");
      if (!/^\d{9}$/.test(form.nuid)) return setError("NUID must be exactly 9 digits.");
      if (form.password !== form.confirm) return setError("Passwords don't match.");
    }

    setLoading(true);
    try {
      // TEMP: bypassing backend until CORS is fully fixed
      onLogin({ email: form.email, name: form.name || form.email.split("@")[0] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const s = {
    root: {
      minHeight: "100vh", width: "100%",
      background: "linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #0d0d0d 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
    },
    logo: { textAlign: "center", marginBottom: 36 },
    logoIcon: { fontSize: 52, marginBottom: 8 },
    logoText: { fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: 5 },
    logoSub: { fontSize: 12, color: "#ff9999", letterSpacing: 3, marginTop: 4 },
    card: {
      background: "#1a1a1a", borderRadius: 20, padding: "40px 44px",
      width: "100%", maxWidth: 460,
      border: "1px solid #2a2a2a", boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    },
    title: { fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6 },
    sub: { fontSize: 13, color: "#aaa", marginBottom: 28 },
    label: { display: "block", fontSize: 12, fontWeight: 700, color: "#ffb3b3", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 },
    input: {
      width: "100%", padding: "12px 16px", borderRadius: 10,
      border: "2px solid #333", fontSize: 14, outline: "none",
      background: "#111", color: "#fff", marginBottom: 18,
      transition: "border .2s", boxSizing: "border-box"
    },
    btn: {
      width: "100%", padding: "14px 0", marginTop: 8,
      background: "linear-gradient(135deg, #8B0000, #cc0000)",
      color: "#fff", border: "none", borderRadius: 12,
      fontWeight: 900, fontSize: 15, cursor: "pointer",
      boxShadow: "0 4px 20px rgba(139,0,0,0.4)", letterSpacing: 1,
    },
    error: {
      background: "#2a0000", border: "1px solid #cc0000",
      borderRadius: 10, padding: "12px 16px", color: "#ff9999",
      fontSize: 13, marginBottom: 18, fontWeight: 600
    },
    toggle: { textAlign: "center", marginTop: 24, fontSize: 13, color: "#aaa" },
    toggleBtn: { color: "#ff6b6b", fontWeight: 700, cursor: "pointer", background: "none", border: "none", fontSize: 13 },
    nuBadge: {
      display: "flex", alignItems: "center", gap: 8,
      background: "#0d0d0d", borderRadius: 10, padding: "10px 14px",
      border: "1px solid #2a2a2a", marginBottom: 28
    },
    nuDot: { width: 8, height: 8, borderRadius: "50%", background: "#cc0000", flexShrink: 0 },
    nuText: { fontSize: 12, color: "#888" },
  };

  return (
    <div style={s.root}>
      <div style={s.logo}>
        <div style={s.logoIcon}>🐾</div>
        <div style={s.logoText}>PAWSWAP</div>
        <div style={s.logoSub}>NORTHEASTERN UNIVERSITY</div>
      </div>

      <div style={s.card}>
        <div style={s.title}>{mode === "login" ? "Welcome back, Husky 👋" : "Join PAWSWAP 🐾"}</div>
        <div style={s.sub}>{mode === "login" ? "Sign in to your account" : "Create your student account"}</div>

        <div style={s.nuBadge}>
          <div style={s.nuDot} />
          <div style={s.nuText}>Northeastern students only — @northeastern.edu required</div>
        </div>

        {error && <div style={s.error}>⚠️ {error}</div>}

        {mode === "signup" && (
          <>
            <label style={s.label}>Full Name</label>
            <input style={s.input} placeholder="Jane Doe" value={form.name} onChange={set("name")} />
            <label style={s.label}>NUID</label>
            <input style={s.input} placeholder="9-digit ID" value={form.nuid} onChange={set("nuid")} maxLength={9} />
          </>
        )}

        <label style={s.label}>Northeastern Email</label>
        <input style={s.input} type="email" placeholder="husky@northeastern.edu" value={form.email} onChange={set("email")} />

        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />

        {mode === "signup" && (
          <>
            <label style={s.label}>Confirm Password</label>
            <input style={s.input} type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} />
          </>
        )}

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>

        <div style={s.toggle}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button style={s.toggleBtn} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
