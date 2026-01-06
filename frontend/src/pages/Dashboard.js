import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ticketService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getAll();
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f39c12",
      approved: "#3498db",
      rejected: "#e74c3c",
      completed: "#27ae60",
      revoked: "#95a5a6",
    };
    return colors[status] || "#95a5a6";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#95a5a6",
      medium: "#f39c12",
      high: "#e74c3c",
    };
    return colors[priority] || "#95a5a6";
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "my-tickets") {
      // For assignees: show tickets they created
      if (user?.role === "assignee") return ticket.reporterId === user?.id;
      // For users: show tickets assigned to them
      return ticket.assigneeId === user?.id;
    }
    if (filter === "pending") return ticket.status === "pending";
    if (filter === "approved") return ticket.status === "approved";
    return true;
  });

  if (loading) {
    return <div className="loading-container">Loading tickets...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Ticket Dashboard</h1>
        {(user?.role === "assignee" || user?.role === "admin") && (
          <Link to="/tickets/new" className="btn-new-ticket">
            + New Ticket
          </Link>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-bar">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All ({tickets.length})
        </button>
        <button
          className={filter === "my-tickets" ? "active" : ""}
          onClick={() => setFilter("my-tickets")}
        >
          {user?.role === "assignee" ? "Created by Me" : "Assigned to Me"} (
          {filteredTickets.filter((t) => filter === "my-tickets").length})
        </button>
        <button
          className={filter === "pending" ? "active" : ""}
          onClick={() => setFilter("pending")}
        >
          Pending ({tickets.filter((t) => t.status === "pending").length})
        </button>
        <button
          className={filter === "approved" ? "active" : ""}
          onClick={() => setFilter("approved")}
        >
          Approved ({tickets.filter((t) => t.status === "approved").length})
        </button>
      </div>

      <div className="tickets-grid">
        {filteredTickets.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets found</p>
            {(user?.role === "assignee" || user?.role === "admin") && (
              <Link to="/tickets/new">Create your first ticket</Link>
            )}
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <Link
              to={`/tickets/${ticket.id}`}
              key={ticket.id}
              className="ticket-card"
            >
              <div className="ticket-header">
                <h3>{ticket.title}</h3>
                <span
                  className="priority-badge"
                  style={{ background: getPriorityColor(ticket.priority) }}
                >
                  {ticket.priority}
                </span>
              </div>

              <p className="ticket-description">
                {ticket.description?.substring(0, 100) || "No description"}
                {ticket.description?.length > 100 && "..."}
              </p>

              <div className="ticket-footer">
                <span
                  className="status-badge"
                  style={{ background: getStatusColor(ticket.status) }}
                >
                  {ticket.status}
                </span>
                <div className="ticket-meta">
                  <span>Created: {ticket.creator?.name || "Unknown"}</span>
                  {ticket.assignedUser && <span>For: {ticket.assignedUser.name}</span>}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
