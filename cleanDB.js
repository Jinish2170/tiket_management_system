const { sequelize } = require("./src/models");

async function cleanDatabase() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS "TicketTags" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Tags" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "ActivityLogs" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Comments" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Tickets" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Priorities" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Statuses" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Users" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;');

    console.log("✅ All tables dropped successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

cleanDatabase();
