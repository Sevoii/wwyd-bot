module.exports = {
  upgrade: async (connection) => {
    await connection.run(`
        ALTER TABLE WwydChannels
            ADD COLUMN autoseason INTEGER DEFAULT 0;
    `);
  },
};
