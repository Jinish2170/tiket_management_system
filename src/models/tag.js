"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate(models) {
      // Tag belongs to many Tickets through TicketTag
      Tag.belongsToMany(models.Ticket, {
        through: "TicketTags",
        foreignKey: "tagId",
        otherKey: "ticketId",
        as: "tickets",
      });
    }
  }
  Tag.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Tag",
    }
  );
  return Tag;
};
