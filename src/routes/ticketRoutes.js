const express = require("express");
const ticketController = require("../controllers/ticketController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, ticketController.createTicket);
router.get("/", authenticateToken, ticketController.getTickets);
router.get("/:id", authenticateToken, ticketController.getTicketById);

module.exports = router;
