import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ticketService,
  commentService,
  activityService,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TicketDetail.css";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTicket();
    fetchComments();
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTicket = async () => {
    try {
      const data = await ticketService.getById(id);
      setTicket(data);
    } catch (err) {
      setError("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await commentService.getByTicketId(id);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments");
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await activityService.getByTicketId(id);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities");
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await ticketService.updateStatus(id, newStatus);
      fetchTicket();
      fetchActivities();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleRevoke = async () => {
    if (window.confirm("Are you sure you want to revoke this ticket?")) {
      try {
        await ticketService.revokeTicket(id);
        fetchTicket();
        fetchActivities();
      } catch (err) {
        alert(err.response?.data?.error || "Failed to revoke ticket");
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentService.create(id, newComment);
      setNewComment("");
      fetchComments();
    } catch (err) {
      alert("Failed to add comment");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await ticketService.delete(id);
        navigate("/dashboard");
      } catch (err) {
        alert("Failed to delete ticket");
      }
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!ticket) return <div className="error-container">Ticket not found</div>;

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
    const colors = { low: "#95a5a6", medium: "#f39c12", high: "#e74c3c" };
    return colors[priority] || "#95a5a6";
  };

  const canChangeStatus = () => {
    return (user?.role === "assignee" && ticket.reporterId === user.id) || user?.role === "admin";
  };

  const canRevoke = () => {
    return user?.role === "user" && ticket.assigneeId === user.id;
  };

  const canDelete = () => {
    return (user?.role === "assignee" && ticket.reporterId === user.id) || user?.role === "admin";
  };

  return (
    <div className="ticket-detail-container">
      <div className="ticket-detail-header">
        <div>
          <h1>{ticket.title}</h1>
          <div className="ticket-meta-info">
            <span>Created by {ticket.creator?.name || "Unknown"}</span>
            {ticket.assignedUser && (
              <span>• For: {ticket.assignedUser.name}</span>
            )}
            <span>
              • {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="ticket-badges">
          <span
            className="badge"
            style={{ background: getPriorityColor(ticket.priority) }}
          >
            {ticket.priority}
          </span>
          <span
            className="badge"
            style={{ background: getStatusColor(ticket.status) }}
          >
            {ticket.status}
          </span>
        </div>
      </div>

      <div className="ticket-actions">
        {canChangeStatus() && (
          <div className="form-group">
            <label>Change Status:</label>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        )}

        {canRevoke() && ticket.status !== "revoked" && (
          <button onClick={handleRevoke} className="btn-warning">
            Revoke Ticket
          </button>
        )}

        {canDelete() && (
          <button onClick={handleDelete} className="btn-delete">
            Delete Ticket
          </button>
        )}
      </div>

      <div className="tabs">
        <button
          className={activeTab === "details" ? "active" : ""}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button
          className={activeTab === "comments" ? "active" : ""}
          onClick={() => setActiveTab("comments")}
        >
          Comments ({comments.length})
        </button>
        <button
          className={activeTab === "activity" ? "active" : ""}
          onClick={() => setActiveTab("activity")}
        >
          Activity ({activities.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "details" && (
          <div className="details-tab">
            <h3>Description</h3>
            <p>{ticket.description || "No description provided"}</p>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="comments-tab">
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
              />
              <button type="submit" className="btn-primary">
                Add Comment
              </button>
            </form>

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-data">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <strong>{comment.author?.name || "Unknown"}</strong>
                      <span>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="activity-tab">
            {activities.length === 0 ? (
              <p className="no-data">No activity yet</p>
            ) : (
              <div className="activity-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div>
                      <strong>{activity.user?.name}</strong> {activity.action}
                      <div className="activity-time">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
