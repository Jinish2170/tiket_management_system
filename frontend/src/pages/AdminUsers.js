import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/api";
import "./AdminUsers.css";

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") {
      setError("Access denied. Admin only.");
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError("");
      setSuccess("");
      await userService.updateRole(userId, newRole);
      setSuccess(`Role updated successfully!`);
      fetchUsers(); // Refresh the list
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      user: "#3498db",
      assignee: "#f39c12",
      admin: "#e74c3c",
    };
    return colors[role] || "#95a5a6";
  };

  if (loading) {
    return <div className="loading-container">Loading users...</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="admin-users-container">
        <div className="error-message">Access denied. This page is for admins only.</div>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <p className="subtitle">Manage user roles and permissions</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    className="role-badge"
                    style={{ background: getRoleBadgeColor(u.role) }}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="role-select"
                    disabled={u.id === user.id} // Prevent self-modification
                  >
                    <option value="user">User</option>
                    <option value="assignee">Assignee</option>
                    <option value="admin">Admin</option>
                  </select>
                  {u.id === user.id && (
                    <span className="self-label">(You)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="role-legend">
        <h3>Role Descriptions:</h3>
        <ul>
          <li>
            <strong>User:</strong> Can view assigned tickets and revoke them
          </li>
          <li>
            <strong>Assignee:</strong> Can create tickets, assign to users, and manage their own tickets
          </li>
          <li>
            <strong>Admin:</strong> Full access to all tickets, users, and system settings
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminUsers;
