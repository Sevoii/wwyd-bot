module.exports = {
  upgrade: async (connection) => {
    await connection.run(`
      ALTER TABLE UserScore
        ADD COLUMN streak INTEGER DEFAULT 0;
    `);

    await connection.run(`
      ALTER TABLE UserScore
        ADD COLUMN best_streak INTEGER DEFAULT 0;
    `);
  },
};
