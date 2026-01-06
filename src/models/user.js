"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User has many tickets as reporter
      User.hasMany(models.Ticket, {
        foreignKey: "reporterId",
        as: "reportedTickets",
      });
      // User has many tickets as assignee
      User.hasMany(models.Ticket, {
        foreignKey: "assigneeId",
        as: "assignedTickets",
      });
      // User has many Comments
      User.hasMany(models.Comment, {
        foreignKey: "userId",
        as: "comments",
      });
      // User has many ActivityLogs
      User.hasMany(models.ActivityLog, {
        foreignKey: "userId",
        as: "activityLogs",
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password_hash: DataTypes.STRING,
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
        validate: {
          isIn: [["user", "assignee", "admin"]],
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
    }
  );
  return User;
};
