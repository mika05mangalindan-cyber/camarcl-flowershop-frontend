// FILE: admin/src/routes/AdminRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import Products from "../pages/Products.jsx";
import Orders from "../pages/Orders.jsx";
import Users from "../pages/Users.jsx"; 
import Inventory from "../pages/Inventory.jsx";
import Sidebar from "../layouts/Sidebar.jsx";
import Profile from "../pages/Profile.jsx";
import AccountSettings from "../pages/AccountSettings.jsx";
import Login from "../pages/Login.jsx";

const AdminRoutes = () => {
  // Simple auth check using localStorage
  const isLoggedIn = !!localStorage.getItem("user");

  // Layout wrapper for protected admin pages
  const ProtectedLayout = ({ children }) => {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col bg-gray-50 overflow-auto">
          <main className="flex-1 mt-16 lg:mt-10 p-6">{children}</main>
        </div>
      </div>
    );
  };

  return (
    <Routes>
      {/* Public login page with onLogin handler */}
      <Route
        path="/login"
        element={
          <Login
            onLogin={(user) => {
              // Save user info to localStorage
              localStorage.setItem("user", JSON.stringify(user));
              // Redirect to dashboard after login
              window.location.href = "/dashboard";
            }}
          />
        }
      />

      {/* Protected admin routes */}
      <Route
        path="dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="products"
        element={
          <ProtectedLayout>
            <Products />
          </ProtectedLayout>
        }
      />
      <Route
        path="orders"
        element={
          <ProtectedLayout>
            <Orders />
          </ProtectedLayout>
        }
      />
      <Route
        path="inventory"
        element={
          <ProtectedLayout>
            <Inventory />
          </ProtectedLayout>
        }
      />
      <Route
        path="users"
        element={
          <ProtectedLayout>
            <Users />
          </ProtectedLayout>
        }
      />
      <Route
        path="profile"
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />
      <Route
        path="account-settings"
        element={
          <ProtectedLayout>
            <AccountSettings />
          </ProtectedLayout>
        }
      />

      {/* Catch-all redirect */}
      <Route
        path="*"
        element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

export default AdminRoutes;
