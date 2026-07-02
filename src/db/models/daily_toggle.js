module.exports = class DailyToggle {
  constructor(db) {
    this.db = db;
  }

  async getDailyChannels() {
    try {
      return await this.db.all(
        `SELECT *
         FROM WwydChannels`,
        {},
      );
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getAutoseasonGuilds() {
    try {
      return await this.db.all(
        `SELECT guild_id
         FROM WwydChannels
         WHERE autoseason = 1;`,
        {},
      );
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
          `DELETE
           FROM WwydChannels
           WHERE channel_id = @channelId`,
          { channelId },
        );
      }

      await this.db.run("COMMIT;");
    } catch (err) {
      console.error(err);

      await this.db.run(`ROLLBACK;`);
    }
  }

  async getGuildData(guildId) {
    return await this.db.get(
      `SELECT *
       FROM WwydChannels
       WHERE guild_id = @guildId`,
      {
        guildId,
      },
    );
  }

  async deleteGuildChannel(guildId) {
    await this.db.run(
      `DELETE
       FROM WwydChannels
       WHERE guild_id = @guildId`,
      {
        guildId,
      },
    );
  }

  async enableGuildChannel(
    guildId,
    channelId,
    autoseason = null,
    pingoncorrect = null,
    dailyping = null,
  ) {
    await this.db.run(`BEGIN TRANSACTION;`);
    try {
      await this.db.run(
        `
          INSERT INTO WwydChannels (guild_id, channel_id)
          VALUES (@guildId, @channelId)
          ON CONFLICT(guild_id)
            DO UPDATE SET channel_id = @channelId;
        `,
        { guildId, channelId },
      );

      if (pingoncorrect != null) {
        await this.db.run(
          `UPDATE WwydChannels
           SET pingoncorrect=@pingoncorrect
           WHERE guild_id = @guildId`,
          { guildId, pingoncorrect },
        );
      }

      if (autoseason != null) {
        await this.db.run(
          `UPDATE WwydChannels
           SET autoseason=@autoseason
           WHERE guild_id = @guildId`,
          { guildId, autoseason },
        );
      }

      if (dailyping != null) {
        await this.db.run(
          `UPDATE WwydChannels
           SET dailyping=@dailyping
           WHERE guild_id = @guildId`,
          { guildId, dailyping },
        );
      }

      await this.db.run(
        `
          INSERT INTO Season (guild_id, season, is_active)
          VALUES (@guildId, 1, 1)
          ON CONFLICT (guild_id, season) DO NOTHING
        `,
        { guildId },
      );

      await this.db.run(`COMMIT;`);
    } catch (err) {
      await this.db.run(`ROLLBACK;`);
      throw err;
    }
  }

  async toggleDaily(guildId, channelId) {
    try {
      if (await this.getGuildData(guildId)) {
        await this.deleteGuildChannel(guildId);
        return 0;
      } else {
        await this.enableGuildChannel(guildId, channelId);
        return 1;
      }
    } catch (err) {
      console.error(err);
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

  async stageNewSeason(guildId, active = 0) {
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
          INSERT INTO Season (guild_id, season, is_active)
          VALUES (@guildId, @season, @active)
          ON CONFLICT (guild_id, season) DO NOTHING;
        `,
        { guildId, season: season + 1, active },
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

  async setAutoseason(guildId, on) {
    await this.db.run(
      `
        UPDATE WwydChannels
        SET autoseason = @updated
        WHERE guild_id = @guildId`,
      { guildId, updated: on },
    );
  }

  async toggleAutoseason(guildId) {
    try {
      const entry = await this.getGuildData(guildId);

      if (entry) {
        const on = 1 - entry.autoseason;
        await this.setAutoseason(guildId, on);
        return on;
      } else {
        return -1;
      }
    } catch (err) {
      console.error(err);
      return -1;
    }
  }

  async setPingoncorrect(guildId, on) {
    await this.db.run(
      `
        UPDATE WwydChannels
        SET pingoncorrect = @updated
        WHERE guild_id = @guildId`,
      { guildId, updated: on },
    );
  }

  async togglePingoncorrect(guildId) {
    try {
      const entry = await this.getGuildData(guildId);

      if (entry) {
        const on = 1 - entry.pingoncorrect;
        await this.setPingoncorrect(guildId, on);
        return on;
      } else {
        return -1;
      }
    } catch (err) {
      console.error(err);
      return -1;
    }
  }

  async setDailyping(guildId, on) {
    await this.db.run(
      `
        UPDATE WwydChannels
        SET dailyping = @updated
        WHERE guild_id = @guildId`,
      { guildId, updated: on },
    );
  }
};
