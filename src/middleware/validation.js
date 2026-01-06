// Middleware to validate request body against Joi schema
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ error: `Validation error: ${messages}` });
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
};

// Middleware to validate query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ error: `Validation error: ${messages}` });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateQuery,
};
