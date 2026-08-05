import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import Clients from "../pages/Clients";
import ClientProfile from "../pages/ClientProfile";
import Cases from "../pages/Cases";
import NewCase from "../pages/NewCase";
import CaseDetails from "../pages/CaseDetails";
import Hearings from "../pages/Hearings";
import Documents from "../pages/Documents";
import NotificationsPage from "../pages/NotificationsPage";
import Settings from "../pages/Settings";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import Register from "../pages/Register";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages: Accessible without logging in */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Pages: Wrapped inside the Route Guard */}
      <Route element={<ProtectedRoute />}>
        {/* All nested routes share the Dashboard Sidebar Layout */}
        <Route path="/" element={<DashboardLayout />}>
          {/* '/' defaults to the Dashboard Overview */}
          <Route index element={<Dashboard />} />
          
          {/* '/dashboard' loads the Dashboard Overview */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* '/clients' loads the Clients list */}
          <Route path="clients" element={<Clients />} />

          {/* '/clients/:clientId' loads the detailed Client Profile */}
          <Route path="clients/:clientId" element={<ClientProfile />} />

          {/* '/cases' loads the Cases list */}
          <Route path="cases" element={<Cases />} />
          
          {/* '/cases/new' loads the New Case form page */}
          <Route path="cases/new" element={<NewCase />} />
          
          {/* '/cases/:caseId' loads the detailed Case Details page */}
          <Route path="cases/:caseId" element={<CaseDetails />} />

          {/* '/hearings' loads the Hearing Management page */}
          <Route path="hearings" element={<Hearings />} />

          {/* '/documents' loads the Global Document Repository */}
          <Route path="documents" element={<Documents />} />

          {/* '/notifications' loads the Notification Management page */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* '/settings' loads lawyer settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* 404 Catch-All: Any unmatched URL renders the NotFound page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
