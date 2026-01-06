"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop old enum if exists and create new one
    await queryInterface.sequelize.query(
      `ALTER TABLE "Tickets" DROP CONSTRAINT IF EXISTS "Tickets_status_check"`
    );

    // Add new status enum
    await queryInterface.sequelize.query(
      `ALTER TABLE "Tickets" 
       ALTER COLUMN "status" TYPE VARCHAR(20),
       ALTER COLUMN "status" SET DEFAULT 'pending'`
    );

    // Add constraint for new enum values
    await queryInterface.sequelize.query(
      `ALTER TABLE "Tickets"
       ADD CONSTRAINT "Tickets_status_check" 
       CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'revoked'))`
    );

    // Update existing tickets to use new status
    await queryInterface.sequelize.query(
      `UPDATE "Tickets" 
       SET status = 'pending' WHERE status = 'open'`
    );
    await queryInterface.sequelize.query(
      `UPDATE "Tickets" 
       SET status = 'approved' WHERE status = 'in_progress'`
    );
    await queryInterface.sequelize.query(
      `UPDATE "Tickets" 
       SET status = 'completed' WHERE status = 'closed'`
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert to old enum
    await queryInterface.sequelize.query(
      `ALTER TABLE "Tickets" DROP CONSTRAINT IF EXISTS "Tickets_status_check"`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Tickets" 
       ALTER COLUMN "status" TYPE VARCHAR(20),
       ALTER COLUMN "status" SET DEFAULT 'open'`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Tickets"
       ADD CONSTRAINT "Tickets_status_check" 
       CHECK (status IN ('open', 'in_progress', 'closed'))`
    );
  },
};
