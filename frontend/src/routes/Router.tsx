import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "../store/authStore";

import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { HospitalDashboard } from "../pages/hospital/Dashboard";
import { HospitalRequests } from "../pages/hospital/Requests";
import { HospitalTransfers } from "../pages/hospital/Transfers";
import { BloodBankDashboard } from "../pages/bloodbank/Dashboard";
import { BloodBankInventory } from "../pages/bloodbank/Inventory";
import { BloodBankDonations } from "../pages/bloodbank/Donations";
import { SharedAnalytics } from "../pages/SharedAnalytics";
import { AdminDonors } from "../pages/admin/Donors";
import { AdminInventory } from "../pages/admin/Inventory";
import { AdminOrganizations } from "../pages/admin/Organizations";
import { DonorDashboard } from "../pages/donor/Dashboard";
import { DonorDonations } from "../pages/donor/Donations";
import { Unauthorized } from "../pages/Unauthorized";

const Router: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  const getDashboardRedirect = () => {
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

    switch (user.role) {
      case "admin":
        return <Navigate to="/analytics" replace />;
      case "hospital":
        return <Navigate to="/hospital" replace />;
      case "blood_bank":
        return <Navigate to="/bloodbank" replace />;
      case "donor":
        return <Navigate to="/donor" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/403" element={<Unauthorized />} />

      {/* Protected routes by role */}
      <Route element={<ProtectedRoute allowedRoles={["hospital"]} />}>
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/hospital/requests" element={<HospitalRequests />} />
        <Route path="/hospital/transfers" element={<HospitalTransfers />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["blood_bank"]} />}>
        <Route path="/bloodbank" element={<BloodBankDashboard />} />
        <Route path="/bloodbank/inventory" element={<BloodBankInventory />} />
        <Route path="/bloodbank/donations" element={<BloodBankDonations />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<Navigate to="/analytics" replace />} />
        <Route path="/admin/donors" element={<AdminDonors />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/organizations" element={<AdminOrganizations />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin", "hospital", "blood_bank", "donor"]} />}>
        <Route path="/analytics" element={<SharedAnalytics />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["donor"]} />}>
        <Route path="/donor" element={<DonorDashboard />} />
        <Route path="/donor/donations" element={<DonorDonations />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={getDashboardRedirect()} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export { Router };
