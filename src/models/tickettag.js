"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TicketTag extends Model {
    static associate(models) {
      // Associations defined in Ticket and Tag models
    }
  }
  TicketTag.init(
    {
      ticketId: DataTypes.INTEGER,
      tagId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "TicketTag",
    }
  );
  return TicketTag;
};
