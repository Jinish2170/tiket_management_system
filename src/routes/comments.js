const express = require("express");
const { Comment, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);

// POST /comments - Create new comment on a ticket
router.post("/", async (req, res) => {
  try {
    const { ticketId, body } = req.body;

    if (!ticketId || !body) {
      return res.status(400).json({ error: "ticketId and body are required" });
    }

    const comment = await Comment.create({
      ticketId,
      userId: req.user.id, // From authenticated user
      body,
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /comments/:ticketId - Get all comments for a ticket with author info
router.get("/:ticketId", async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { ticketId: req.params.ticketId },
      include: [{ model: User, as: "author" }],
      order: [["createdAt", "DESC"]],
    });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /comments/:id - Update comment
router.put("/:id", async (req, res) => {
  try {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: "body is required" });
    }

    const [updated] = await Comment.update(
      { body },
      { where: { id: req.params.id } }
    );

    if (!updated) return res.status(404).json({ error: "Comment not found" });

    const comment = await Comment.findByPk(req.params.id, {
      include: [
        { model: User, as: "author", attributes: ["id", "name", "email"] },
      ],
    });

    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /comments/:id - Delete comment
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Comment.destroy({ where: { id: req.params.id } });

    if (!deleted) return res.status(404).json({ error: "Comment not found" });

    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
