module.exports = {
  upgrade: async (connection) => {
    await connection.run(`
      ALTER TABLE WwydChannels
        ADD COLUMN dailythread INTEGER DEFAULT 0;
    `);
  },
};
