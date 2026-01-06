"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ActivityLog extends Model {
    static associate(models) {
      // ActivityLog belongs to Ticket
      ActivityLog.belongsTo(models.Ticket, {
        foreignKey: "ticketId",
        as: "ticket",
      });
      // ActivityLog belongs to User (who made the change)
      ActivityLog.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }
  ActivityLog.init(
    {
      ticketId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      action: {
        type: DataTypes.STRING,
        comment: "e.g., created, updated_status, assigned, commented",
      },
      changes: {
        type: DataTypes.JSON,
        comment: "What changed: {field: {old: value, new: value}}",
      },
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "ActivityLog",
    }
  );
  return ActivityLog;
};
