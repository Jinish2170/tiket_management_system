const { ActivityLog } = require("../models");

// Helper to log activity
const logActivity = async (
  ticketId,
  userId,
  action,
  changes = null,
  description = null
) => {
  try {
    await ActivityLog.create({
      ticketId,
      userId,
      action,
      changes,
      description,
    });
  } catch (err) {
    console.error("Error logging activity:", err);
  }
};

module.exports = {
  logActivity,
};
