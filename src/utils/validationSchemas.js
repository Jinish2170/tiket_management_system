const Joi = require("joi");

// Auth validations
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
  role: Joi.string().valid("user", "admin").default("user"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Ticket validations
const ticketCreateSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).max(5000),
  reporterId: Joi.number().integer().required(),
  assigneeId: Joi.number().integer(),
  statusId: Joi.number().integer(),
  priorityId: Joi.number().integer(),
});

const ticketUpdateSchema = Joi.object({
  title: Joi.string().min(5).max(255),
  description: Joi.string().min(10).max(5000),
  assigneeId: Joi.number().integer().allow(null),
  statusId: Joi.number().integer().allow(null),
  priorityId: Joi.number().integer().allow(null),
  userId: Joi.number().integer(), // For logging activity
});

// Comment validations
const commentCreateSchema = Joi.object({
  ticketId: Joi.number().integer().required(),
  userId: Joi.number().integer().required(),
  body: Joi.string().min(1).max(5000).required(),
});

const commentUpdateSchema = Joi.object({
  body: Joi.string().min(1).max(5000).required(),
});

// Tag validations
const tagCreateSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
});

const addTagsSchema = Joi.object({
  tagIds: Joi.array().items(Joi.number().integer()).required(),
});

// Search validations
const searchSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().max(5000),
  status: Joi.string(),
  priority: Joi.string(),
  assigneeId: Joi.number().integer(),
  reporterId: Joi.number().integer(),
  tags: Joi.string(), // comma-separated
  sortBy: Joi.string().valid("createdAt", "title", "priorityId"),
  sortOrder: Joi.string().valid("ASC", "DESC"),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});

module.exports = {
  registerSchema,
  loginSchema,
  ticketCreateSchema,
  ticketUpdateSchema,
  commentCreateSchema,
  commentUpdateSchema,
  tagCreateSchema,
  addTagsSchema,
  searchSchema,
};
