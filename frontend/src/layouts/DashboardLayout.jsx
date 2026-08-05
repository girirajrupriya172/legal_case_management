import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-on-surface flex min-h-screen w-full relative selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Sidebar Navigation (Sticky on Desktop, Drawer on Mobile) */}
      <Sidebar
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface min-h-screen">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-margin-page custom-scrollbar">
          <div className="max-w-container-max mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-surface-container-low border-t border-outline-variant/60">
          <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 sm:px-margin-page py-4 max-w-container-max mx-auto gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <span className="font-bold text-primary">Patidar & Associates Law Firm</span>
              <span className="hidden sm:inline">•</span>
              <span>© 2026 Legal Management System. All Rights Reserved.</span>
            </div>
            <div className="flex gap-4 sm:gap-gutter flex-wrap justify-center">
              <a className="hover:text-primary transition-colors focus-ring rounded" href="#">
                Support
              </a>
              <a className="hover:text-primary transition-colors focus-ring rounded" href="#">
                Privacy Policy
              </a>
              <a className="hover:text-primary transition-colors focus-ring rounded" href="#">
                Terms of Service
              </a>
              <a className="hover:text-primary transition-colors focus-ring rounded" href="#">
                Security
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
