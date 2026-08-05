import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function Login() {
  return (
    <main className="flex min-h-screen bg-surface text-on-surface font-body-md overflow-hidden">
      {/* Left Side: Login Form Container */}
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
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Access your secure legal workspace, case files, and court dockets.
            </p>
          </div>

          {/* Subcomponent Form */}
          <LoginForm />

          {/* SSO / Alternative Login Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/60"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-container-lowest px-4 text-xs font-bold text-outline uppercase tracking-wider">
                Or Continue With
              </span>
            </div>
          </div>

          {/* SSO / Biometric Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-outline-variant/80 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-xs font-bold text-primary focus-ring btn-press cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-lg">key</span>
              <span>Firm SSO</span>
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-outline-variant/80 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-xs font-bold text-primary focus-ring btn-press cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-lg">fingerprint</span>
              <span>Biometric ID</span>
            </button>
          </div>

          {/* Registration Prompt Link */}
          <p className="text-center text-xs sm:text-sm text-on-surface-variant pt-2">
            Don't have an attorney account?{" "}
            <Link to="/register" className="text-primary font-bold hover:underline focus-ring rounded">
              Register your law firm
            </Link>
          </p>
        </div>

        {/* Footer Info Section */}
        <footer className="text-center pt-4 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-outline">
          <p>© 2026 Lexora Legal Systems. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="#" className="hover:text-primary transition-colors focus-ring rounded">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-primary transition-colors focus-ring rounded">
              Security Standards
            </Link>
          </div>
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
        
        {/* Deep navy legal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#031635]/95 via-[#031635]/85 to-[#1a2b4b]/90 mix-blend-multiply"></div>

        {/* Content Overlay details */}
        <div className="absolute inset-0 flex flex-col justify-end p-12 xl:p-16 text-white z-20">
          <div className="max-w-lg space-y-6">
            <div className="w-16 h-1 bg-amber-400 rounded-full mb-6"></div>
            <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
              Precision-Engineered for Elite Legal Counsel.
            </h2>
            <p className="text-sm xl:text-base text-white/80 leading-relaxed">
              Join over 500 top-tier law firms managing complex litigation, client portfolios, court dockets, and encrypted documentation through Lexora's unified ecosystem.
            </p>
            
            {/* Grid display stats */}
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

        {/* Floating Decorative Trust Partner Badge */}
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
