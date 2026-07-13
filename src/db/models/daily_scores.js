module.exports = class DailyScores {
  constructor(db) {
    this.db = db;
  }

  async getLeaderboard(guildId, season) {
    try {
      if (season !== 0) {
        return await this.db.all(
          `SELECT UserScore.discord_id, UserScore.streak, SeasonScores.score, SeasonScores.attempts
           FROM UserScore
                  LEFT JOIN SeasonScores
                            ON UserScore.discord_id = SeasonScores.discord_id
                              AND UserScore.guild_id = SeasonScores.guild_id
           WHERE UserScore.guild_id = @guildId
             AND SeasonScores.season = @season
           ORDER BY SeasonScores.score DESC, SeasonScores.attempts, UserScore.streak DESC
           LIMIT 10`,
          { guildId, season },
        );
      } else {
        return await this.db.all(
          `SELECT discord_id, MAX(streak) as streak, SUM(score) AS score, SUM(attempts) as attempts
           FROM (SELECT UserScore.discord_id,
                        UserScore.guild_id,
                        UserScore.streak,
                        SeasonScores.score,
                        SeasonScores.attempts
                 FROM UserScore
                        LEFT JOIN SeasonScores
                                  ON UserScore.discord_id = SeasonScores.discord_id
                                    AND UserScore.guild_id = SeasonScores.guild_id
                 WHERE UserScore.guild_id = @guildId)
           GROUP BY discord_id, guild_id
           ORDER BY score DESC, attempts, streak DESC
           LIMIT 10`,
          { guildId },
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async getLeaderboardAcc(guildId, season) {
    try {
      if (season !== 0) {
        return await this.db.all(
          `SELECT UserScore.discord_id, UserScore.streak, SeasonScores.score, SeasonScores.attempts
           FROM UserScore
                  LEFT JOIN SeasonScores
                            ON UserScore.discord_id = SeasonScores.discord_id
                              AND UserScore.guild_id = SeasonScores.guild_id
           WHERE UserScore.guild_id = @guildId
             AND SeasonScores.season = @season
             AND SeasonScores.attempts > 9
           ORDER BY SeasonScores.score / SeasonScores.attempts DESC, streak DESC
           LIMIT 10`,
          { guildId, season },
        );
      } else {
        return await this.db.all(
          `SELECT discord_id, MAX(streak) as streak, SUM(score) AS score, SUM(attempts) as attempts
           FROM (SELECT UserScore.discord_id,
                        UserScore.guild_id,
                        UserScore.streak,
                        SeasonScores.score,
                        SeasonScores.attempts
                 FROM UserScore
                        LEFT JOIN SeasonScores
                                  ON UserScore.discord_id = SeasonScores.discord_id
                                    AND UserScore.guild_id = SeasonScores.guild_id
                 WHERE UserScore.guild_id = @guildId)
           GROUP BY discord_id, guild_id
           HAVING SUM(attempts) > 9
           ORDER BY score / attempts DESC, streak DESC
           LIMIT 10`,
          { guildId },
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async getStreak(guildId, discordId) {
    try {
      return await this.db.get(
        `SELECT streak, best_streak
         FROM UserScore
         WHERE guild_id = @guildId
           AND discord_id = @discordId
         LIMIT 1;`,
        { guildId, discordId },
      );
    } catch (e) {
      console.error(e);
      return { streak: -1, best_streak: -1 };
    }
  }

  async getScore(guildId, discordId, season) {
    try {
      if (season === 0) {
        // Global Score
        return await this.db.get(
          `SELECT SUM(score) as score, SUM(attempts) as attempts
           FROM SeasonScores
           WHERE guild_id = @guildId
             AND discord_id = @discordId
          `,
          { guildId, discordId },
        );
      } else {
        // Season Score
        return await this.db.get(
          `SELECT score, attempts
           FROM SeasonScores
           WHERE guild_id = @guildId
             AND discord_id = @discordId
             AND season = @season
           LIMIT 1`,
          { guildId, discordId, season },
        );
      }
    } catch (err) {
      console.error(err);
      return { score: -1, attempts: -1 };
    }
  }

  async getHistory(guildId, discordId, incorrect, skip, limit) {
    try {
      const rows = await this.db.all(
        `
          WITH answers AS (SELECT problem_id, correct, answer
                           FROM WwydScore
                           WHERE guild_id = @guildId
                             AND discord_id = @discordId
                             AND (NOT @incorrect OR NOT correct)
                             AND answer != 'na'
                           ORDER BY problem_id DESC
                           LIMIT @limit OFFSET @skip)
          SELECT WwydDaily.internal_id as internal_id, answers.correct as correct, answers.answer as answer
          FROM answers
                 LEFT JOIN WwydDaily ON answers.problem_id = WwydDaily.problem_id
        `,
        {
          guildId,
          discordId,
          incorrect: incorrect ? 1 : 0,
          skip,
          limit: limit + 1,
        },
      );

      const hasNextPage = rows.length > limit;
      const results = hasNextPage ? rows.slice(0, limit) : rows;

      return { results, hasNextPage };
    } catch (err) {
      console.error(err);
      return { results: [], hasNextPage: false };
    }
  }
};
