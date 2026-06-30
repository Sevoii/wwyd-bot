module.exports = {
  upgrade: async (connection) => {
    await connection.run(`
      ALTER TABLE WwydChannels
        ADD COLUMN pingoncorrect INTEGER DEFAULT 1;
    `);
  },
};
