"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      // Comment belongs to Ticket
      Comment.belongsTo(models.Ticket, {
        foreignKey: "ticketId",
        as: "ticket",
      });
      // Comment belongs to User (who wrote the comment)
      Comment.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
      });
    }
  }
  Comment.init(
    {
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ticketId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Comment",
    }
  );
  return Comment;
};
