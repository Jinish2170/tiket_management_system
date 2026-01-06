const express = require("express");
const { Tag } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRole } = require("../middleware/authorization");
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);

// POST /tags - Create new tag (admin only)
router.post("/", authorizeRole("admin"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Tag name is required" });

    const tag = await Tag.create({ name });
    res.status(201).json(tag);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Tag already exists" });
    }
    res.status(400).json({ error: err.message });
  }
});

// GET /tags - Get all tags
router.get("/", async (req, res) => {
  try {
    const tags = await Tag.findAll();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tags/:id - Get single tag
router.get("/:id", async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tags/:id - Delete tag (admin only)
router.delete("/:id", authorizeRole("admin"), async (req, res) => {
  try {
    const deleted = await Tag.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Tag not found" });
    res.json({ message: "Tag deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
