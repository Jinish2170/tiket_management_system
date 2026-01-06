// Middleware to check if user has required role(s)
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

// Middleware to check if user can access a specific ticket
const authorizeTicketAccess = (requiredRole = null) => {
  return async (req, res, next) => {
    const { Ticket } = require("../models");
    const ticketId = req.params.id;

    try {
      const ticket = await Ticket.findByPk(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Admin can access all tickets
      if (req.user.role === "admin") {
        req.ticket = ticket;
        return next();
      }

      // Assignee (creator) can access tickets they created
      if (req.user.role === "assignee" && ticket.reporterId === req.user.id) {
        req.ticket = ticket;
        return next();
      }

      // User can access tickets assigned to them
      if (req.user.role === "user" && ticket.assigneeId === req.user.id) {
        req.ticket = ticket;
        return next();
      }

      return res.status(403).json({
        error: "You do not have permission to access this ticket",
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
};

// Middleware to check if user is owner of a resource
const authorizeOwner = (resourceUserIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const resourceUserId = req.body[resourceUserIdField] || req.params.userId;

    if (req.user.userId !== resourceUserId && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied. You can only manage your own resources",
      });
    }

    next();
  };
};

// Middleware to check if user is assignee or admin
const authorizeAssignee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!["assignee", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      error: "Forbidden: Only assignees and admins can perform this action",
    });
  }
  next();
};

module.exports = {
  authorizeRole,
  authorizeOwner,
  authorizeTicketAccess,
  authorizeAssignee,
};
