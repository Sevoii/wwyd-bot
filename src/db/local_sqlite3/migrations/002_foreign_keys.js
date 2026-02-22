module.exports = {
  upgrade: async (connection) => {

    // Table of WWYD Channels to send daily wwyds in
    await connection.run(`
      CREATE TABLE WwydScore_Migrate
      (
        guild_id   VARCHAR(18) NOT NULL, -- discord guild id, 18 numbers
        problem_id VARCHAR(16) NOT NULL, -- unique problem id, currently consisting of date-wwyd_id

        discord_id VARCHAR(18) NOT NULL, -- discord id 
        correct    INTEGER     NOT NULL, -- Whether they answered correctly or not
        answer     VARCHAR(2)  NOT NULL, -- Their actual answer

        PRIMARY KEY (guild_id, problem_id, discord_id),
        FOREIGN KEY (guild_id, problem_id) REFERENCES WwydDaily (guild_id, problem_id)
      );
    `);

    await connection.run(`
      INSERT INTO WwydScore_Migrate (guild_id, problem_id, discord_id, correct, answer)
      SELECT guild_id, problem_id, discord_id, correct, answer
      FROM WwydScore;
    `);

    await connection.run(`
      DROP TABLE WwydScore;
    `);

    await connection.run(`
      ALTER TABLE WwydScore_Migrate RENAME TO WwydScore;
    `);
  },
};
