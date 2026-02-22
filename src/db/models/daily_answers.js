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
                     AND problem_id = @problemId`,
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
          await this.db.run(
            `INSERT INTO UserScore (guild_id, discord_id, score, correct, attempts)
             VALUES (@guildId,
                     @discordId,
                     @score,
                     CASE WHEN @score > 0 THEN 1 ELSE 0 END,
                     1)
             ON CONFLICT(guild_id, discord_id)
               DO UPDATE SET score    = score + @score,
                             correct  = correct + (CASE WHEN @score > 0 THEN 1 ELSE 0 END),
                             attempts = attempts + 1;
            `,
            {
              guildId,
              discordId,
              score,
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
}

