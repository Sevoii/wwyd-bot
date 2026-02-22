module.exports = {
  upgrade: async (connection) => {
    await connection.run(`
      CREATE TABLE IF NOT EXISTS WwydChannels
      (
        guild_id   VARCHAR(18) PRIMARY KEY, -- discord guild id, 18 numbers
        channel_id VARCHAR(18) NOT NULL     -- discord channel id in guild to send to
      );
    `);

    // Table of WWYD Daily problems that have been sent out
    await connection.run(`
      CREATE TABLE IF NOT EXISTS WwydDaily
      (
        guild_id    VARCHAR(18) NOT NULL,               -- discord guild id, 18 numbers
        problem_id  VARCHAR(16) NOT NULL,               -- unique problem id, currently consisting of date-wwyd_id

        internal_id INTEGER     NOT NULL,               -- wwyd internal id
        channel_id  VARCHAR(18) NOT NULL,               -- discord channel id the message was in
        message_id  VARCHAR(20) NOT NULL,               -- discord message id the message points to
        created     DATETIME DEFAULT CURRENT_TIMESTAMP, -- created timestamp

        PRIMARY KEY (guild_id, problem_id)              -- theoretically should be unique
      );
    `);

    // Table of WWYD Daily Answers
    await connection.run(`
      CREATE TABLE IF NOT EXISTS WwydScore
      (
        guild_id   VARCHAR(18) NOT NULL, -- discord guild id, 18 numbers
        problem_id VARCHAR(16) NOT NULL, -- unique problem id, currently consisting of date-wwyd_id

        discord_id VARCHAR(18) NOT NULL, -- discord id 
        correct    INTEGER     NOT NULL, -- Whether they answered correctly or not
        answer     VARCHAR(2)  NOT NULL, -- Their actual answer

        PRIMARY KEY (guild_id, problem_id, discord_id)
      );
    `);

    await connection.run(`
      CREATE TABLE IF NOT EXISTS UserScore
      (
        guild_id   VARCHAR(18) NOT NULL, -- discord guild id, 18 numbers
        discord_id VARCHAR(18) NOT NULL, -- discord id
        score      INTEGER     NOT NULL, -- wwyd score, currently is the same as attempts
        correct    INTEGER     NOT NULL, -- number of wwyd correct answers
        attempts   INTEGER     NOT NULL, -- number of total attempts
        PRIMARY KEY (guild_id, discord_id)
      );
    `);
  },
};
