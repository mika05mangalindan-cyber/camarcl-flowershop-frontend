import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

axios.defaults.withCredentials = true;

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!onLogin || typeof onLogin !== "function") {
      setError("Login handler not configured properly.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      const user = res.data.user;

      if (!user) {
        setError("Invalid server response.");
        return;
      }

      onLogin(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side image */}
      <div className="hidden md:flex md:w-1/2 bg-green-700 items-center justify-center">
        <img
          src="/display.jpg"
          alt="Login Illustration"
          className="w-full h-full object-cover rounded-r-3xl"
        />
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8 md:p-12 bg-gray-50">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-md lg:max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-green-700 mb-6 text-center">
            Admin Login
          </h2>

          {error && (
            <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-500 text-sm font-medium"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            &copy; 2025 Camarcl Flowershop 
          </p>
        </div>
      </div>
    </div>
  );
}
