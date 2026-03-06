module.exports = class DailyAnswers {
  constructor(db) {
    this.db = db;
  }

  async addAnswer(guildId, discordId, problemId, answer, score, isPass) {
    try {
      await this.db.run("BEGIN TRANSACTION;");

      if (
        await this.db.get(
          `SELECT *
           FROM WwydScore
           WHERE guild_id = @guildId
             AND discord_id = @discordId
             AND problem_id = @problemId
           LIMIT 1;`,
          { guildId, discordId, problemId },
        )
      ) {
        await this.db.run("COMMIT;");
        return 0;
      } else {
        await this.db.run(
          `INSERT INTO WwydScore (guild_id, discord_id, problem_id, answer, correct)
           VALUES (@guildId, @discordId, @problemId,
                   @answer, @score)
           ON CONFLICT(guild_id, discord_id, problem_id) DO NOTHING`,
          {
            guildId,
            discordId,
            problemId,
            score,
            answer,
          },
        );

        if (!isPass) {
          let season = (
            await this.db.get(
              `
              SELECT COALESCE(MAX(season), 1) AS current_season
              FROM Season
              WHERE guild_id = @guildId
                AND is_active = 1;`,
              { guildId },
            )
          ).current_season;

          await this.db.run(
            `INSERT INTO UserScore (guild_id, discord_id, streak, best_streak)
             VALUES (@guildId,
                     @discordId,
                     CASE WHEN @score > 0 THEN 1 ELSE 0 END,
                     CASE WHEN @score > 0 THEN 1 ELSE 0 END)
             ON CONFLICT(guild_id, discord_id)
               DO UPDATE SET streak      = CASE WHEN @score > 0 THEN streak + 1 ELSE 0 END,
                             best_streak = MAX(CASE WHEN @score > 0 THEN streak + 1 ELSE 0 END, best_streak);
            `,
            {
              guildId,
              discordId,
              score,
            },
          );

          await this.db.run(
            `
              INSERT INTO SeasonScores (guild_id, discord_id, score, attempts, season)
              VALUES (@guildId, @discordId, @score, 1, @season)
              ON CONFLICT (guild_id, discord_id, season)
                DO UPDATE SET score    = score + @score,
                              attempts = attempts + 1;
            `,
            {
              guildId,
              discordId,
              score,
              season,
            },
          );
        }

        await this.db.run("COMMIT;");
        return 1;
      }
    } catch (err) {
      console.error(err);

      await this.db.run("ROLLBACK;");
      return -1;
    }
  }
};
