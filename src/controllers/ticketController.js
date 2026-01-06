const { Ticket, User } = require("../models");

exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, assigneeId } = req.body;
    const reporterId = req.user.id; // From auth middleware

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const ticketData = {
      title,
      description,
      priority: priority || "medium",
      reporterId,
      assigneeId: assigneeId || null,
    };

    const ticket = await Ticket.create(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
