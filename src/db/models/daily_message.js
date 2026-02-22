module.exports = class DailyMessage {
  constructor(db) {
    this.db = db;
  }

  async setLatestWwyd(guildId, problemId, internalId, channelId, messageId) {
    try {
      await this.db.run(
        `INSERT INTO WwydDaily (guild_id, problem_id, internal_id, channel_id, message_id)
         VALUES (@guildId, @problemId, @internalId, @channelId, @messageId)
         ON CONFLICT(guild_id, problem_id) DO NOTHING
        `,
        {
          guildId,
          problemId,
          internalId,
          channelId,
          messageId,
        },
      );
    } catch (err) {
      console.error(err);
    }
  }

  async getPrevStats(guildId) {
    try {
      const data = await this.db.get(
        `SELECT problem_id, internal_id, channel_id, message_id
         FROM WwydDaily
         WHERE guild_id = @guildId
         ORDER BY created DESC
         LIMIT 1
        `,
        { guildId },
      );

      if (data) {
        const data1 = await this.db.get(
          `SELECT SUM(correct > 0) as successes, COUNT(*) as attempts
           FROM WwydScore
           WHERE guild_id = @guildId
             AND problem_id = @problemId
             AND answer != 'na'
          `, {
          guildId,
          problemId: data.problem_id,
        });

        const data2 = await this.db.all(
          `SELECT s.discord_id AS discord_id, us.score AS score, s.correct as correct, s.answer as answer
           FROM WwydScore s
                  JOIN UserScore us
                       ON s.discord_id = us.discord_id AND s.guild_id = us.guild_id
           WHERE s.guild_id = @guildId
             AND s.problem_id = @problemId
             AND answer != 'na'
           ORDER BY s.correct DESC, us.score DESC
          `, {
          guildId,
          problemId: data.problem_id,
        });

        if (data1 && data2) {
          return {
            channelId: data.channel_id,
            messageId: data.message_id,
            internalId: data.internal_id,
            successes: data1.successes ?? 0,
            attempts: data1.attempts ?? 0,
            answerers: data2
              .filter((x) => x.correct > 0)
              .map((x) => {
                return { discord_id: x.discord_id, score: x.score };
              }),
            answerCounts: data2.reduce((acc, x) => {
              acc[x.answer] = (acc[x.answer] || 0) + 1;
              return acc;
            }, {}),
          };
        }
      }

      return null;
    } catch (err) {
      console.error(err);
    }
  }
};
