const express = require("express");
const cors = require("cors");
const { sequelize } = require("./src/models");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Ticket Management System API" });
});

// Auth routes (no authentication needed)
app.use("/auth", require("./src/routes/auth"));

// Ticket routes (role-based)
app.use("/tickets", require("./src/routes/ticketsRoleBased"));

// Comment routes
app.use("/comments", require("./src/routes/comments"));

// Tag routes
app.use("/tags", require("./src/routes/tags"));

// Activity routes
app.use("/activity", require("./src/routes/activity"));

// Assignment routes (admin tracking)
app.use("/assignments", require("./src/routes/assignments"));

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Sequelize connected to database.");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Sequelize connection error", err);
  }
}

startServer();
