// FILE: admin/src/routes/AdminRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import Products from "../pages/Products.jsx";
import Orders from "../pages/Orders.jsx";
import Users from "../pages/Users.jsx"; 
import Inventory from "../pages/Inventory.jsx";
import Sidebar from "../layouts/Sidebar.jsx";
import Notifications from "../components/Notifications.jsx";
import Profile from "../pages/Profile";
import AccountSettings from "../pages/AccountSettings";

const AdminRoutes = () => {
  return (
    <div className="flex min-h-screen">

      <Sidebar />

      <div className="flex-1 flex flex-col bg-gray-50 overflow-auto">
        <main className="flex-1 mt-16 lg:mt-10 p-6">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="users" element={<Users />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/account-settings" element={<AccountSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminRoutes;
