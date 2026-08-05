import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginForm() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  // Form State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Micro-interaction focus states for icons
  const [focusedField, setFocusedField] = useState(null);

  // Validate inputs before submitting
  const validateForm = () => {
    setError(null);

    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    // Password length validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop standard form refresh
    
    // Run validation checks
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Call AuthContext login action
      await loginUser(email, password);
      // Redirect to dashboard page
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Set the error message parsed from backend (or fallback)
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-stack-md mt-8" onSubmit={handleSubmit} id="loginForm">
      {/* Error alert banner */}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-lg text-body-md border border-error/20 flex items-start gap-3 animate-shake">
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">
          EMAIL ADDRESS
        </label>
        <div className="relative">
          <span
            className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none select-none ${
              focusedField === "email" ? "text-primary" : "text-outline"
            }`}
            aria-hidden="true"
          >
            mail
          </span>
          <input
            className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-body-md input-focus-ring transition-all duration-200"
            id="email"
            type="email"
            placeholder="name@firm-email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            disabled={submitting}
            required
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">
            PASSWORD
          </label>
          <Link to="/forgot-password" className="font-label-md text-label-md text-primary hover:underline">
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <span
            className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none select-none ${
              focusedField === "password" ? "text-primary" : "text-outline"
            }`}
            aria-hidden="true"
          >
            lock
          </span>
          <input
            className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-body-md input-focus-ring transition-all duration-200"
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            disabled={submitting}
            required
          />
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center gap-2 py-2">
        <input
          className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary-fixed cursor-pointer"
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={submitting}
        />
        <label className="font-body-md text-body-md text-on-surface-variant cursor-pointer select-none" htmlFor="remember">
          Keep me logged in for 30 days
        </label>
      </div>

      {/* Submit Button */}
      <button
        className="w-full py-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md shadow-lg hover:bg-primary-container active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Signing In..." : "Sign In"}
        {!submitting && <span className="material-symbols-outlined">arrow_forward</span>}
      </button>
    </form>
  );
}
