const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRole } = require("../middleware/authorization");
const router = express.Router();

// POST /auth/register - Register new user with role selection
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // Validate role
    const validRoles = ["user", "assignee", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role,
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login - Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/users - Get all users (assignees and admins only)
router.get("/users", authenticateToken, authorizeRole("assignee", "admin"), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role"],
      order: [["name", "ASC"]],
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /auth/users/:id/role - Update user role (admin only)
router.put("/users/:id/role", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role || !["user", "assignee", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be user, assignee, or admin" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({ role });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
