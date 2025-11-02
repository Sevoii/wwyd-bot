const db = require("better-sqlite3")("wwyd.db");
db.pragma("journal_mode = WAL");

const WWYD_CHANNELS = "WwydChannels";
const SCORES = "WwydScore";

db.prepare(
  `CREATE TABLE IF NOT EXISTS ${WWYD_CHANNELS} (guild_id VARCHAR(18) PRIMARY KEY, channel_id VARCHAR(18))`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS ${SCORES} (guild_id VARCHAR(18), discord_id VARCHAR(18), problem_id VARCHAR(8), correct BOOLEAN, PRIMARY KEY (guild_id, discord_id, problem_id))`,
).run();

const GET_DAILY_ENABLED = db.prepare(`SELECT * FROM ${WWYD_CHANNELS}`);
const IS_ENABLED = db.prepare(`SELECT *
                               FROM ${WWYD_CHANNELS}
                               WHERE guild_id = @guildId`);
const ENABLE_CH =
  db.prepare(`INSERT INTO ${WWYD_CHANNELS} (guild_id, channel_id)
                           VALUES (@guildId, @channelId)
                           ON CONFLICT(guild_id)
                           DO UPDATE SET channel_id = @channelId`);
const DISABLE_CH = db.prepare(
  `DELETE FROM ${WWYD_CHANNELS} WHERE channel_id = @channelId`,
);
const DISABLE_GUILD = db.prepare(
  `DELETE FROM ${WWYD_CHANNELS} WHERE guild_id = @guildId`,
);

const CHECK_SCORE_EXISTS = db.prepare(`SELECT *
                                       FROM ${SCORES}
                                       WHERE guild_id = @guildId
                                         AND discord_id = @discordId
                                         AND problem_id = @problemId`);

const INSERT_SCORE =
  db.prepare(`INSERT INTO ${SCORES} (guild_id, discord_id, problem_id, correct)
              VALUES (@guildId, @discordId, @problemId,
                      @correct) ON CONFLICT(guild_id, discord_id, problem_id) DO NOTHING`);

const getDailyChannels = () => {
  try {
    return GET_DAILY_ENABLED.all();
  } catch (err) {
    console.error(err);
    return [];
  }
};

// Bulk delete, should not be used outside of daily
const deleteDailyChannels = (channels) => {
  for (let channelId of channels) {
    DISABLE_CH.run({ channelId });
  }
};

const toggleDaily = (guildId, channelId) => {
  try {
    if (
      IS_ENABLED.get({
        guildId,
        channelId,
      })
    ) {
      DISABLE_GUILD.run({
        guildId,
      });

      return 1;
    } else {
      ENABLE_CH.run({
        guildId,
        channelId,
      });

      return 2;
    }
  } catch (err) {
    console.error(err);
    return 0;
  }
};

module.exports = {
  getDailyChannels,
  toggleDaily,
  deleteDailyChannels,
};
