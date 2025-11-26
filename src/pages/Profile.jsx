import React, { useState, Suspense, lazy, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const FiSave = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiSave })));
const FiX = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiX })));
const FiEdit2 = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiEdit2 })));

export default function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [profile, setProfile] = useState({
    name: storedUser.name || "",
    email: storedUser.email || "",
    contact_number: storedUser.contact_number || "",
  });

  const [editMode, setEditMode] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Only update name, email, contact_number — do NOT touch role
      const updateData = {
        name: profile.name,
        email: profile.email,
        contact_number: profile.contact_number,
      };

      await axios.put(`${API_URL}/users/${storedUser.id}`, updateData, { withCredentials: true });

      // Update localStorage while keeping role intact
      const updatedUser = { ...storedUser, ...updateData };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6">Profile</h1>

        <section className="bg-white shadow-sm sm:shadow-md lg:shadow-lg rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["name", "email", "contact_number"].map(field => (
              <div key={field}>
                <label htmlFor={field} className="text-sm text-gray-500 capitalize">
                  {field === "name" ? "Full Name" : field === "email" ? "Email Address" : "Contact Number"}
                </label>
                {editMode ? (
                  <input
                    id={field}
                    name={field}
                    type={field === "email" ? "email" : "text"}
                    value={profile[field]}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="mt-1 font-medium text-gray-700">{profile[field] || "-"}</p>
                )}
              </div>
            ))}
          </div>

          <Suspense fallback={<div>Loading buttons...</div>}>
            <div className="flex flex-wrap gap-4 mt-4">
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 w-full justify-center bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <FiSave className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-2 w-full justify-center bg-gray-300 px-5 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <FiX className="w-5 h-5" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 w-full justify-center bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FiEdit2 className="w-5 h-5" />
                  Edit Profile
                </button>
              )}
            </div>
          </Suspense>
        </section>
      </div>
    </main>
  );
}
