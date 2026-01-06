import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🎫 Ticket Manager</Link>
      </div>

      {isAuthenticated && (
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          {(user?.role === "assignee" || user?.role === "admin") && (
            <Link to="/tickets/new" className="navbar-link">
              New Ticket
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin/users" className="navbar-link">
              Manage Users
            </Link>
          )}
          <div className="navbar-user">
            <span>👤 {user?.name}</span>
            <span className="user-role">({user?.role})</span>
            <button onClick={logout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
