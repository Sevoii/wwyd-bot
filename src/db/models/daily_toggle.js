module.exports = class DailyToggle {
  constructor(db) {
    this.db = db;
  }

  async getDailyChannels() {
    try {
      return await this.db.all(`SELECT * FROM WwydChannels`, {});
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async deleteDailyChannels(channels) {
    for (let channelId of channels) {
      await this.db.run(
        `DELETE FROM WwydChannels WHERE channel_id = @channelId`,
        { channelId },
      );
    }
  }

  async toggleDaily(guildId, channelId) {
    try {
      if (
        await this.db.get(
          `SELECT * FROM WwydChannels WHERE guild_id = @guildId`,
          {
            guildId,
          },
        )
      ) {
        await this.db.run(
          `DELETE FROM WwydChannels WHERE guild_id = @guildId`,
          {
            guildId,
          },
        );
        return 0;
      } else {
        await this.db.run(
          `
          INSERT INTO WwydChannels (guild_id, channel_id)
          VALUES (@guildId, @channelId)
          ON CONFLICT(guild_id)
            DO UPDATE SET channel_id = @channelId;
        `,
          { guildId, channelId },
        );

        return 1;
      }
    } catch (err) {
      console.error(err);
      return -1;
    }
  }
};
