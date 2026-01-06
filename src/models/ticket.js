"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Ticket belongs to User who created it (assignee/admin role)
      Ticket.belongsTo(models.User, {
        foreignKey: "reporterId",
        as: "creator",
      });
      // Ticket belongs to User assigned to it (user role)
      Ticket.belongsTo(models.User, {
        foreignKey: "assigneeId",
        as: "assignedUser",
      });
    }
  }
  Ticket.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        defaultValue: "medium",
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "approved",
          "rejected",
          "completed",
          "revoked"
        ),
        defaultValue: "pending",
      },
      reporterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "User who created the ticket (assignee/admin)",
      },
      assigneeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "User assigned to the ticket (user)",
      },
    },
    {
      sequelize,
      modelName: "Ticket",
      tableName: "Tickets",
    }
  );
  return Ticket;
};
