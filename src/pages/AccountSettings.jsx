import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export default function AccountSettings() {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New password and confirm password do not match!");
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${API_URL}/admin/change-password`, passwords);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password updated successfully!");
    } catch (err) {
      console.error("Error changing password:", err);
      alert("Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    try {
      await axios.delete(`${API_URL}/admin/delete-account`);
      alert("Account deleted successfully!");
      window.location.href = "/";
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Failed to delete account.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">

        <h1 className="text-3xl font-extrabold text-green-700 text-center sm:text-left">
          Account Settings
        </h1>


        <section className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">Change Password</h2>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
            {["currentPassword", "newPassword", "confirmPassword"].map((field, idx) => (
              <div key={idx} className="flex flex-col">
                <label htmlFor={field} className="text-sm text-gray-500 font-medium">
                  {field.replace(/([A-Z])/g, " $1")}
                </label>
                <input
                  id={field}
                  type="password"
                  name={field}
                  value={passwords[field]}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-5 rounded-lg font-medium text-white transition ${
                loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </section>

     
        <section className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 space-y-4 border border-red-100">
          <h2 className="text-2xl font-semibold text-gray-700">Delete Account</h2>
          <p className="text-sm text-gray-500">
            Deleting your account is <span className="font-medium text-red-600">irreversible</span>. 
            All your data will be permanently removed.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="w-full py-3 px-5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Delete Account
          </button>
        </section>

      </div>
    </div>
  );
}
