"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update the role enum to include assignee
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'assignee';
    `);
  },
  async down(queryInterface, Sequelize) {
    // Cannot easily remove enum values in PostgreSQL
    // Would require recreating the enum type
    console.log("Downgrade not supported for ENUM values");
  },
};
