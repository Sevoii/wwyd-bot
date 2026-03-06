module.exports = class DailyScores {
  constructor(db) {
    this.db = db;
  }

  async getLeaderboard(guildId, season) {
    try {
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
    } catch (err) {
      console.error(err);
    }
  }

  async getScore(guildId, discordId, season) {
    try {
      return await this.db.get(
        `SELECT UserScore.discord_id, UserScore.streak, UserScore.best_streak, SeasonScores.score, SeasonScores.attempts
         FROM UserScore
                LEFT JOIN SeasonScores
                          ON UserScore.discord_id = SeasonScores.discord_id
                            AND UserScore.guild_id = SeasonScores.guild_id
           WHERE UserScore.guild_id = @guildId
             AND UserScore.discord_id = @discordId
             AND SeasonScores.season = @season
           LIMIT 1;`,
        { guildId, discordId, season },
      );
    } catch (err) {
      console.error(err);
    }
  }
};
