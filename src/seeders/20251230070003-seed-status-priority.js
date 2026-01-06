"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Statuses",
      [
        { name: "New", createdAt: new Date(), updatedAt: new Date() },
        { name: "Open", createdAt: new Date(), updatedAt: new Date() },
        { name: "In Progress", createdAt: new Date(), updatedAt: new Date() },
        { name: "Resolved", createdAt: new Date(), updatedAt: new Date() },
        { name: "Closed", createdAt: new Date(), updatedAt: new Date() },
      ],
      {}
    );

    await queryInterface.bulkInsert(
      "Priorities",
      [
        { name: "Low", createdAt: new Date(), updatedAt: new Date() },
        { name: "Medium", createdAt: new Date(), updatedAt: new Date() },
        { name: "High", createdAt: new Date(), updatedAt: new Date() },
      ],
      {}
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Statuses", null, {});
    await queryInterface.bulkDelete("Priorities", null, {});
  },
};
