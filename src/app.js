const express = require("express");
const app = express();
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

// ...existing code...

module.exports = app;
