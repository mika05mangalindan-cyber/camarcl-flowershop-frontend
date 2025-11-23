import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";

// ------------------ FIX: Silence NotSupportedError ------------------
if (typeof HTMLAudioElement !== "undefined") {
  HTMLAudioElement.prototype.play = () => Promise.resolve();
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
