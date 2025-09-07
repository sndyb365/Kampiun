// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import AdminDashboard from "./admin/adminlayout"; 
import "./index.css"; // styling global

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Route utama (user) */}
        <Route path="/*" element={<App />} />

        {/* Route admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        
      </Routes>
    </Router>
  </React.StrictMode>
);
