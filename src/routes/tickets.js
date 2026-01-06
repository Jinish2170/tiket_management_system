const express = require("express");
const { Ticket, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const {
  authorizeRole,
  authorizeTicketAccess,
} = require("../middleware/authorization");
const router = express.Router();

// Apply auth middleware to all ticket routes
router.use(authenticateToken);

// ============ ASSIGNEE ONLY ROUTES ============

// POST /tickets - Create ticket (assignee only)
router.post("/", authorizeRole("assignee", "admin"), async (req, res) => {
  try {
    const { title, description, priority, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!assigneeId) {
      return res.status(400).json({ error: "assigneeId is required" });
    }

    // Verify assignee user exists
    const assigneeUser = await User.findByPk(assigneeId);
    if (!assigneeUser) {
      return res.status(400).json({ error: "Assigned user not found" });
    }

    // Only user role can be assigned tickets
    if (assigneeUser.role !== "user") {
      return res
        .status(400)
        .json({ error: "Can only assign tickets to users with 'user' role" });
    }

    const ticketData = {
      title,
      description,
      priority: priority || "medium",
      status: "pending",
      reporterId: req.user.id, // Assignee (creator)
      assigneeId, // User receiving the ticket
    };

    const ticket = await Ticket.create(ticketData);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /tickets/:id/assign - Reassign ticket to different user (assignee only)
router.put(
  "/:id/assign",
  authorizeRole("assignee", "admin"),
  authorizeTicketAccess(),
  async (req, res) => {
    try {
      const { assigneeId } = req.body;

      if (!assigneeId) {
        return res.status(400).json({ error: "assigneeId is required" });
      }

      const assigneeUser = await User.findByPk(assigneeId);
      if (!assigneeUser) {
        return res.status(400).json({ error: "User not found" });
      }

      if (assigneeUser.role !== "user") {
        return res
          .status(400)
          .json({ error: "Can only assign tickets to users with 'user' role" });
      }

      await req.ticket.update({ assigneeId });
      res.json(req.ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// PUT /tickets/:id/status - Change ticket status (assignee only)
router.put(
  "/:id/status",
  authorizeRole("assignee", "admin"),
  authorizeTicketAccess(),
  async (req, res) => {
    try {
      const { status } = req.body;

      const validStatuses = ["pending", "approved", "rejected", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
        });
      }

      await req.ticket.update({ status });
      res.json(req.ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// DELETE /tickets/:id - Delete ticket (assignee only)
router.delete(
  "/:id",
  authorizeRole("assignee", "admin"),
  authorizeTicketAccess(),
  async (req, res) => {
    try {
      await req.ticket.destroy();
      res.json({ message: "Ticket deleted successfully" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ============ USER ONLY ROUTES ============

// PUT /tickets/:id/revoke - User revokes assigned ticket
router.put("/:id/revoke", authorizeRole("user"), async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.assigneeId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only revoke tickets assigned to you" });
    }

    await ticket.update({ status: "revoked", assigneeId: null });
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ SHARED ROUTES ============

// GET /tickets - Get tickets (different based on role)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = {};

    // Assignee sees all tickets they created
    if (req.user.role === "assignee") {
      where.reporterId = req.user.id;
    }
    // User sees only tickets assigned to them
    else if (req.user.role === "user") {
      where.assigneeId = req.user.id;
    }
    // Admin sees all tickets
    // (where remains empty)

    const tickets = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
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

// GET /tickets/:id - Get single ticket details (with access control)
router.get("/:id", authorizeTicketAccess(), async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
      ],
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tickets/:id - Update ticket (limited to assignee)
router.put(
  "/:id",
  authorizeRole("assignee", "admin"),
  authorizeTicketAccess(),
  async (req, res) => {
    try {
      const { title, description, priority } = req.body;

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (priority) updateData.priority = priority;

      const [updated] = await Ticket.update(updateData, {
        where: { id: req.params.id },
      });

      if (!updated) return res.status(404).json({ error: "Ticket not found" });

      const ticket = await Ticket.findByPk(req.params.id, {
        include: [
          { model: User, as: "reporter", attributes: ["id", "name", "email"] },
          { model: User, as: "assignee", attributes: ["id", "name", "email"] },
        ],
      });
      res.json(ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
