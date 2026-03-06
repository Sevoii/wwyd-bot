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
    try {
      await this.db.run("BEGIN TRANSACTION;");

      for (let channelId of channels) {
        await this.db.run(
          `DELETE FROM WwydChannels WHERE channel_id = @channelId`,
          { channelId },
        );
      }

      await this.db.run("COMMIT;");
    } catch (err) {
      console.error(err);

      await this.db.run(`ROLLBACK;`);
    }
  }

  async toggleDaily(guildId, channelId) {
    try {
      await this.db.run(`BEGIN TRANSACTION;`);

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

        await this.db.run(`COMMIT;`);
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

        await this.db.run(
          `
            INSERT INTO Season (guild_id, season, is_active)
            VALUES (@guildId, 1, 1)
            ON CONFLICT (guild_id, season) DO NOTHING
          `,
          { guildId },
        );

        await this.db.run(`COMMIT;`);
        return 1;
      }
    } catch (err) {
      console.error(err);

      await this.db.run(`ROLLBACK;`);
      return -1;
    }
  }

  async commitNewSeasons() {
    try {
      await this.db.run(`UPDATE Season
                         SET is_active=1
                         WHERE is_active = 0`);
    } catch (err) {
      console.error(err);
    }
  }

  async stageNewSeason(guildId) {
    try {
      await this.db.run(`BEGIN TRANSACTION;`);

      let season = await this.getLatestSeason(guildId);
      if (season === -1) {
        console.error("Could not fetch latest season for", guildId);

        await this.db.run(`ROLLBACK;`);
        return -1;
      }

      await this.db.run(
        `
        INSERT INTO Season (guild_id, season)
        VALUES (@guidId, @season)
        ON CONFLICT (guild_id, season) DO NOTHING;
      `,
        { guildId, season: season + 1 },
      );

      await this.db.run(`COMMIT;`);
      return 1;
    } catch (err) {
      console.error(err);

      await this.db.run(`ROLLBACK;`);
      return -1;
    }
  }

  async getLatestSeason(guildId) {
    try {
      let season = await this.db.get(
        `
        SELECT MAX(season) AS current_season
        FROM Season
        WHERE guild_id = @guildId
          AND is_active = 1;`,
        { guildId },
      );

      return season?.current_season ?? 1;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }
};
