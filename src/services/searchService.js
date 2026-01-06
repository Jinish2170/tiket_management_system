const { Op } = require("sequelize");
const { Ticket, User, Status, Priority, Comment, Tag } = require("../models");

// Advanced search with filters
const searchTickets = async (filters = {}, pagination = {}) => {
  const {
    title,
    description,
    status,
    priority,
    assigneeId,
    reporterId,
    tags = [],
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = filters;

  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  const where = {};
  const include = [];

  // Text search in title and description
  if (title) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${title}%` } },
      { description: { [Op.iLike]: `%${title}%` } },
    ];
  }

  // Filter by status
  if (status) {
    include.push({
      model: Status,
      as: "status",
      where: { name: status },
      attributes: [],
    });
  }

  // Filter by priority
  if (priority) {
    include.push({
      model: Priority,
      as: "priority",
      where: { name: priority },
      attributes: [],
    });
  }

  // Filter by assignee
  if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  // Filter by reporter
  if (reporterId) {
    where.reporterId = reporterId;
  }

  // Filter by tags (many-to-many)
  if (tags.length > 0) {
    include.push({
      model: Tag,
      as: "tags",
      where: { name: { [Op.in]: tags } },
      through: { attributes: [] },
    });
  }

  const tickets = await Ticket.findAndCountAll({
    where,
    include: [
      { model: User, as: "reporter", attributes: ["id", "name", "email"] },
      { model: User, as: "assignee", attributes: ["id", "name", "email"] },
      { model: Status, as: "status" },
      { model: Priority, as: "priority" },
      {
        model: Comment,
        as: "comments",
        include: [{ model: User, as: "author" }],
      },
      { model: Tag, as: "tags", through: { attributes: [] } },
      ...include,
    ],
    distinct: true,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]],
    subQuery: false,
  });

  return {
    tickets: tickets.rows,
    total: tickets.count,
    page: parseInt(page),
    pages: Math.ceil(tickets.count / limit),
  };
};

module.exports = {
  searchTickets,
};
