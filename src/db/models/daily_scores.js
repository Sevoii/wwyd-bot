module.exports = class DailyScores {
  constructor(db) {
    this.db = db;
  }

  async getLeaderboard(guildId) {
    try {
      return await this.db.all(
        `SELECT *
         FROM UserScore
         WHERE guild_id = @guildId
         ORDER BY score desc
         LIMIT 10`,
        { guildId },
      );
    } catch (err) {
      console.error(err);
    }
  }

  async getScore(guildId, discordId) {
    try {
      return (
        (await this.db.get(
          `SELECT score
           FROM UserScore
           WHERE guild_id = @guildId
             AND discord_id = @discordId`,
          { guildId, discordId },
        )?.score) ?? 0
      );
    } catch (err) {
      console.error(err);
    }
  }
};
