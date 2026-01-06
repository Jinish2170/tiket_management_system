const express = require("express");
const { Ticket, User, Assignment } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const {
  authorizeAssignee,
  authorizeRole,
} = require("../middleware/authorization");
const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// ===== ASSIGNEE/ADMIN ONLY ROUTES =====

// POST /tickets - Create ticket and assign to user (assignee/admin only)
router.post("/", authorizeAssignee, async (req, res) => {
  try {
    const { title, description, priority, assignedToUserId } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!assignedToUserId) {
      return res.status(400).json({ error: "assignedToUserId is required" });
    }

    // Verify assigned user exists
    const assignedUser = await User.findByPk(assignedToUserId);
    if (!assignedUser) {
      return res.status(404).json({ error: "Assigned user not found" });
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || "medium",
      status: "pending",
      reporterId: req.user.id,
      assigneeId: assignedToUserId,
    });

    // Create assignment record
    await Assignment.create({
      ticketId: ticket.id,
      assignedByUserId: req.user.id,
      assignedToUserId: assignedToUserId,
      action: "assigned",
      notes: `Initial assignment`,
    });

    const createdTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.status(201).json(createdTicket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /tickets - Get tickets based on role
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // If user role, only show tickets assigned to them
    if (req.user.role === "user") {
      whereClause.assigneeId = req.user.id;
    }
    // If assignee/admin, show all tickets they created or all tickets
    else if (req.user.role === "assignee") {
      whereClause.reporterId = req.user.id;
    }
    // Admin sees everything (no filter)

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const tickets = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      tickets: tickets.rows,
      total: tickets.count,
      page: parseInt(page),
      pages: Math.ceil(tickets.count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tickets/:id - Get single ticket with role-based access
router.get("/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check access: users can only see their assigned tickets
    if (req.user.role === "user" && ticket.assigneeId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Assignees can only see tickets they created
    if (req.user.role === "assignee" && ticket.reporterId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tickets/:id/assign - Reassign ticket (assignee/admin only)
router.put("/:id/assign", authorizeAssignee, async (req, res) => {
  try {
    const { assignedToUserId } = req.body;

    if (!assignedToUserId) {
      return res.status(400).json({ error: "assignedToUserId is required" });
    }

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Assignees can only modify their own tickets
    if (req.user.role === "assignee" && ticket.reporterId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only reassign your own tickets" });
    }

    // Verify new assigned user exists
    const newUser = await User.findByPk(assignedToUserId);
    if (!newUser) {
      return res.status(404).json({ error: "Assigned user not found" });
    }

    const previousUserId = ticket.assigneeId;
    await ticket.update({ assigneeId: assignedToUserId });

    // Create assignment record
    await Assignment.create({
      ticketId: ticket.id,
      assignedByUserId: req.user.id,
      assignedToUserId: assignedToUserId,
      action: "reassigned",
      previousAssignedToUserId: previousUserId,
      notes: `Reassigned from user ${previousUserId}`,
    });

    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /tickets/:id/status - Change ticket status (assignee/admin only)
router.put("/:id/status", authorizeAssignee, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "valid",
      "invalid",
      "completed",
      "revoked",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Must be: pending, valid, invalid, completed, or revoked",
      });
    }

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Assignees can only modify their own tickets
    if (req.user.role === "assignee" && ticket.reporterId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only modify your own tickets" });
    }

    await ticket.update({ status });

    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /tickets/:id - Update ticket details (assignee/admin only)
router.put("/:id", authorizeAssignee, async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Assignees can only modify their own tickets
    if (req.user.role === "assignee" && ticket.reporterId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only modify your own tickets" });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;

    await ticket.update(updateData);

    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /tickets/:id - Delete ticket (assignee/admin only)
router.delete("/:id", authorizeAssignee, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Assignees can only delete their own tickets
    if (req.user.role === "assignee" && ticket.reporterId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own tickets" });
    }

    await ticket.destroy();
    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== USER ROUTES =====

// PUT /tickets/:id/revoke - User revokes their assigned ticket
router.put("/:id/revoke", async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Users can only revoke tickets assigned to them
    if (ticket.assigneeId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only revoke tickets assigned to you" });
    }

    // Check if ticket is already revoked or completed
    if (ticket.status === "revoked" || ticket.status === "completed") {
      return res.status(400).json({
        error: `Cannot revoke ticket with status: ${ticket.status}`,
      });
    }

    await ticket.update({ status: "revoked" });

    // Create assignment record for revocation
    await Assignment.create({
      ticketId: ticket.id,
      assignedByUserId: req.user.id, // User who revoked
      assignedToUserId: ticket.assigneeId,
      action: "revoked",
      notes: `Ticket revoked by user`,
    });

    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
