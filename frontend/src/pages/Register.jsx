import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRegister(email, password, fullName);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-surface text-on-surface font-body-md overflow-hidden">
      {/* Left Side: Registration Form Container */}
      <section className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-12 bg-surface-container-lowest z-10 shadow-2xl lg:shadow-none min-h-screen">
        
        {/* Brand Anchor Header */}
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-extrabold text-xl shadow-xs">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
              Lexora Legal Systems
            </h1>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
              Enterprise Litigation Workspace
            </p>
          </div>
        </header>

        {/* Form & Headers Group */}
        <div className="w-full max-w-md mx-auto py-8 my-auto space-y-6 animate-fade-in">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Register Your Law Firm
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Create an administrator account to set up your encrypted legal workspace.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-error-container/50 text-on-error-container border border-error/30 rounded-2xl text-xs flex items-center gap-2 font-medium animate-slide-up">
              <span className="material-symbols-outlined text-lg text-error">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-2xl text-xs flex items-center gap-2 font-medium animate-slide-up">
              <span className="material-symbols-outlined text-lg text-emerald-700">verified</span>
              <span>Account registered successfully! Redirecting to login portal...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline" htmlFor="fullName">
                Full Name *
              </label>
              <div className="relative">
                <span
                  className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg pointer-events-none transition-colors ${
                    focusedField === "fullName" ? "text-primary" : "text-outline"
                  }`}
                  aria-hidden="true"
                >
                  person
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  id="fullName"
                  type="text"
                  placeholder="Attorney John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField(null)}
                  disabled={submitting || success}
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline" htmlFor="email">
                Email Address *
              </label>
              <div className="relative">
                <span
                  className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg pointer-events-none transition-colors ${
                    focusedField === "email" ? "text-primary" : "text-outline"
                  }`}
                  aria-hidden="true"
                >
                  mail
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  id="email"
                  type="email"
                  placeholder="name@firm-email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  disabled={submitting || success}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline" htmlFor="password">
                Password *
              </label>
              <div className="relative">
                <span
                  className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg pointer-events-none transition-colors ${
                    focusedField === "password" ? "text-primary" : "text-outline"
                  }`}
                  aria-hidden="true"
                >
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  disabled={submitting || success}
                  required
                />
              </div>
            </div>

            {/* Terms and Conditions checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="agreeTerms"
                type="checkbox"
                className="w-4 h-4 rounded accent-primary border-outline-variant cursor-pointer focus-ring"
                disabled={submitting || success}
                required
              />
              <label htmlFor="agreeTerms" className="text-xs text-on-surface-variant cursor-pointer select-none">
                I agree to the Terms of Service & Privacy Policy
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-semibold text-xs sm:text-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 focus-ring btn-press cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              type="submit"
              disabled={submitting || success}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Registering Firm...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Return back to Sign In */}
          <p className="text-center text-xs sm:text-sm text-on-surface-variant pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline focus-ring rounded">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer Copyright */}
        <footer className="text-center pt-4 border-t border-outline-variant/40 text-xs text-outline">
          <p>© 2026 Lexora Legal Systems. All Rights Reserved.</p>
        </footer>
      </section>

      {/* Right Side: Decorative Hero Branding Section */}
      <section className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-10000 hover:scale-105" 
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0mQW9FxhLjG6vKB9Ifg7EImLqcefO5CJ9hwPbVuKuxT3Yrp_s3PzdOvegQUqVf3xgZ23CJv7PcZedXa3OeGKJ9nSwzdez8h8HGcAF4ucZSufw3gTMqX6KoGeX83tzdG4b8qACT7aWrVik8WOFnuj_MTquq7sttVpwftmujQ_LHrlGOAz9uSyHFQJuylhCJwgSg2r8d4etfodSigXMQeveMBVSr8uL_xXHkIioIqKM0ceOSOQXqqqG_E7O0N84yOtO6gobsxg9xgMr')"
          }}
        >
        </div>
        <div className="absolute inset-0 bg-gradient-to-[#031635]/95 via-[#031635]/85 to-[#1a2b4b]/90 mix-blend-multiply"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-12 xl:p-16 text-white z-20">
          <div className="max-w-lg space-y-6">
            <div className="w-16 h-1 bg-amber-400 rounded-full mb-6"></div>
            <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
              Precision-Engineered for Elite Legal Counsel.
            </h2>
            <p className="text-sm xl:text-base text-white/80 leading-relaxed">
              Join over 500 top-tier law firms managing complex litigation, client portfolios, court dockets, and encrypted documentation through Lexora's unified ecosystem.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div>
                <p className="text-xl xl:text-2xl font-extrabold text-white">256-bit</p>
                <p className="text-xs text-white/70 font-medium">AES Encryption</p>
              </div>
              <div>
                <p className="text-xl xl:text-2xl font-extrabold text-white">99.9%</p>
                <p className="text-xs text-white/70 font-medium">Uptime SLA</p>
              </div>
              <div>
                <p className="text-xl xl:text-2xl font-extrabold text-white">ISO 27001</p>
                <p className="text-xs text-white/70 font-medium">Security Certified</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-8 right-8 z-20">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">Enterprise Verified</p>
              <p className="text-[10px] text-white/70 font-medium">SOC 2 Type II Compliant</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
