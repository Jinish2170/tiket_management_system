import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ticketService, userService } from "../services/api";
import "./TicketForm.css";

const TicketForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      // Filter only users with 'user' role
      const regularUsers = data.filter((u) => u.role === "user");
      setUsers(regularUsers);
    } catch (err) {
      console.error("Failed to load users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!assignedToUserId) {
      setError("Please select a user to assign the ticket to");
      return;
    }

    setLoading(true);

    try {
      await ticketService.create({
        title,
        description,
        priority,
        assignedToUserId: parseInt(assignedToUserId),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>Create New Ticket</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Movie Ticket: Avengers Endgame"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              placeholder="Details about the ticket (time, seat, etc.)..."
            />
          </div>

          <div className="form-group">
            <label>Priority *</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assign To User *</label>
            <select
              value={assignedToUserId}
              onChange={(e) => setAssignedToUserId(e.target.value)}
              required
            >
              <option value="">-- Select a user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <small className="form-hint">
              Select the user who will receive this ticket
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
