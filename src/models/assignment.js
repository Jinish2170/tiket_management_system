"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Assignment extends Model {
    static associate(models) {
      // Assignment belongs to Ticket
      Assignment.belongsTo(models.Ticket, {
        foreignKey: "ticketId",
        as: "ticket",
      });
      // Assignment belongs to User (who made the assignment - assignee/admin)
      Assignment.belongsTo(models.User, {
        foreignKey: "assignedByUserId",
        as: "assignedBy",
      });
      // Assignment belongs to User (who was assigned the ticket - user)
      Assignment.belongsTo(models.User, {
        foreignKey: "assignedToUserId",
        as: "assignedTo",
      });
    }
  }
  Assignment.init(
    {
      ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      assignedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "User who made the assignment (assignee/admin)",
      },
      assignedToUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "User who was assigned the ticket",
      },
      action: {
        type: DataTypes.ENUM("assigned", "reassigned", "revoked"),
        defaultValue: "assigned",
        comment: "Type of assignment action",
      },
      previousAssignedToUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Previous user if this was a reassignment",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Optional notes about the assignment",
      },
    },
    {
      sequelize,
      modelName: "Assignment",
      tableName: "Assignments",
    }
  );
  return Assignment;
};
