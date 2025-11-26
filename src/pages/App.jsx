import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

const API_URL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/dashboard`)
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  if (!user) return <Login onLogin={setUser} />;

  return <Dashboard user={user} />;
}
