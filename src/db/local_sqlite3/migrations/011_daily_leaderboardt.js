module.exports = {
  upgrade: async (connection) => {
    await connection.run(`
      ALTER TABLE WwydChannels
        ADD COLUMN dailyleaderboard INTEGER DEFAULT 0;
    `);
  },
};
