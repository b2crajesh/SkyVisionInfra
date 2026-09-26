import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Properties from "./pages/public/Properties";
import Projects from "./pages/public/Projects";
import HowItWorks from "./pages/public/HowItWorks";
import Membership from "./pages/public/Membership";
import Sponsor from "./pages/public/Sponsor";
import Commission from "./pages/public/Commission";
import FAQ from "./pages/public/FAQ";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import Terms from "./pages/public/Terms";
import Disclaimer from "./pages/public/Disclaimer";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminMembers from "./pages/admin/Members";
import AdminAddMember from "./pages/admin/AddMember";
import AdminMemberDetail from "./pages/admin/MemberDetail";
import AdminEditMember from "./pages/admin/EditMember";
import AdminSales from "./pages/admin/Sales";
import AdminAddSale from "./pages/admin/AddSale";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";

import MemberDashboard from "./pages/member/Dashboard";
import MemberProfile from "./pages/member/Profile";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/properties" element={<Properties />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/sponsor" element={<Sponsor />} />
      <Route path="/commission" element={<Commission />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/disclaimer" element={<Disclaimer />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members"
        element={
          <ProtectedRoute role="admin">
            <AdminMembers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members/new"
        element={
          <ProtectedRoute role="admin">
            <AdminAddMember />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminMemberDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members/:id/edit"
        element={
          <ProtectedRoute role="admin">
            <AdminEditMember />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales"
        element={
          <ProtectedRoute role="admin">
            <AdminSales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales/new"
        element={
          <ProtectedRoute role="admin">
            <AdminAddSale />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/member"
        element={
          <ProtectedRoute role="member">
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/profile"
        element={
          <ProtectedRoute role="member">
            <MemberProfile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
