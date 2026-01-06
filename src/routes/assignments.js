const express = require("express");
const { Assignment, User, Ticket } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRole } = require("../middleware/authorization");
const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// GET /assignments - Get all assignments (admin only)
router.get("/", authorizeRole("admin"), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      ticketId,
      assignedBy,
      assignedTo,
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (ticketId) whereClause.ticketId = ticketId;
    if (assignedBy) whereClause.assignedByUserId = assignedBy;
    if (assignedTo) whereClause.assignedToUserId = assignedTo;

    const assignments = await Assignment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Ticket,
          as: "ticket",
          attributes: ["id", "title", "status", "priority"],
        },
        {
          model: User,
          as: "assignedBy",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedTo",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      assignments: assignments.rows,
      total: assignments.count,
      page: parseInt(page),
      pages: Math.ceil(assignments.count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /assignments/ticket/:ticketId - Get assignment history for a ticket
router.get("/ticket/:ticketId", async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check access: users can only see assignments for their tickets
    if (req.user.role === "user" && ticket.assigneeId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Assignees can only see assignments for tickets they created
    if (req.user.role === "assignee" && ticket.reporterId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const assignments = await Assignment.findAll({
      where: { ticketId: req.params.ticketId },
      include: [
        {
          model: User,
          as: "assignedBy",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "assignedTo",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /assignments/stats - Get assignment statistics (admin only)
router.get("/stats", authorizeRole("admin"), async (req, res) => {
  try {
    const { Assignment: AssignmentModel, sequelize } = require("../models");

    // Total assignments
    const totalAssignments = await AssignmentModel.count();

    // Assignments by action type
    const assignmentsByAction = await AssignmentModel.findAll({
      attributes: [
        "action",
        [sequelize.fn("COUNT", sequelize.col("Assignment.id")), "count"],
      ],
      group: ["action"],
      raw: true,
    });

    // Top assignees (who assign the most tickets)
    const topAssignees = await AssignmentModel.findAll({
      attributes: [
        "assignedByUserId",
        [
          sequelize.fn("COUNT", sequelize.col("Assignment.id")),
          "assignmentCount",
        ],
      ],
      include: [
        {
          model: User,
          as: "assignedBy",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      group: ["assignedByUserId", "assignedBy.id"],
      order: [[sequelize.fn("COUNT", sequelize.col("Assignment.id")), "DESC"]],
      limit: 10,
      subQuery: false,
    });

    // Users with most tickets assigned to them
    const topAssignedUsers = await AssignmentModel.findAll({
      attributes: [
        "assignedToUserId",
        [sequelize.fn("COUNT", sequelize.col("Assignment.id")), "ticketCount"],
      ],
      include: [
        {
          model: User,
          as: "assignedTo",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      group: ["assignedToUserId", "assignedTo.id"],
      order: [[sequelize.fn("COUNT", sequelize.col("Assignment.id")), "DESC"]],
      limit: 10,
      subQuery: false,
    });

    res.json({
      totalAssignments,
      assignmentsByAction,
      topAssignees,
      topAssignedUsers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /assignments/user/:userId - Get assignments for a specific user (admin only)
router.get("/user/:userId", authorizeRole("admin"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get tickets assigned BY this user (if assignee/admin)
    const assignedByUser = await Assignment.findAll({
      where: { assignedByUserId: req.params.userId },
      include: [
        {
          model: Ticket,
          as: "ticket",
          attributes: ["id", "title", "status", "priority"],
        },
        {
          model: User,
          as: "assignedTo",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get tickets assigned TO this user
    const assignedToUser = await Assignment.findAll({
      where: { assignedToUserId: req.params.userId },
      include: [
        {
          model: Ticket,
          as: "ticket",
          attributes: ["id", "title", "status", "priority"],
        },
        {
          model: User,
          as: "assignedBy",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      assignedByUser: assignedByUser,
      assignedToUser: assignedToUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
