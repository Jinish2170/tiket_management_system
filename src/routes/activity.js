const express = require("express");
const { ActivityLog, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);

// GET /activity/:ticketId - Get all activity for a ticket
router.get("/:ticketId", async (req, res) => {
  try {
    const activities = await ActivityLog.findAll({
      where: { ticketId: req.params.ticketId },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /activity/:ticketId/user/:userId - Get activity by specific user on ticket
router.get("/:ticketId/user/:userId", async (req, res) => {
  try {
    const activities = await ActivityLog.findAll({
      where: {
        ticketId: req.params.ticketId,
        userId: req.params.userId,
      },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
