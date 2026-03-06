module.exports = {
  upgrade: async (connection) => {
    await connection.run(`
      CREATE TABLE SeasonScores
      (
        guild_id   VARCHAR(18) NOT NULL, -- discord guild id, 18 numbers
        discord_id VARCHAR(18) NOT NULL, -- discord id
        score      INTEGER     NOT NULL, -- streak
        attempts   INTEGER     NOT NULL, -- best streak
        season     INTEGER     NOT NULL,
        PRIMARY KEY (guild_id, discord_id, season)
      );
    `);

    await connection.run(`
      INSERT INTO SeasonScores (guild_id, discord_id, score, attempts, season)
      SELECT guild_id, discord_id, score, attempts, 1
      FROM UserScore;
    `);

    await connection.run(`
      CREATE TABLE UserScore_Migrate
      (
        guild_id    VARCHAR(18) NOT NULL, -- discord guild id, 18 numbers
        discord_id  VARCHAR(18) NOT NULL, -- discord id
        streak      INTEGER     NOT NULL, -- streak
        best_streak INTEGER     NOT NULL, -- best streak
        PRIMARY KEY (guild_id, discord_id)
      );
    `);

    await connection.run(`
      INSERT INTO UserScore_Migrate (guild_id, discord_id, streak, best_streak)
      SELECT guild_id, discord_id, streak, best_streak
      FROM UserScore;
    `);

    await connection.run(`
      DROP TABLE UserScore;
    `);

    await connection.run(`
      ALTER TABLE UserScore_Migrate RENAME TO UserScore;
    `);

    await connection.run(`
      CREATE TABLE Season
      (
        guild_id  VARCHAR(18) NOT NULL,           -- discord guild id, 18 numbers
        season    INTEGER     NOT NULL,           -- season id
        is_active INTEGER     NOT NULL DEFAULT 0, --  whether this season is rolled out or not
        PRIMARY KEY (guild_id, season)
      )
    `);

    await connection.run(`
      INSERT INTO Season (guild_id, season, is_active)
      SELECT DISTINCT guild_id, 1, 1
      FROM UserScore
    `);
  },
};
