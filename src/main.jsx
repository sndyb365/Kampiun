import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App"; // route utama user
import AdminDashboard from "./admin/adminlayout"; // route admin
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Route admin harus di atas supaya duluan match */}
        <Route path="/admin/*" element={<AdminDashboard />} />

        {/* Route utama user */}
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
