const db = require("better-sqlite3")("wwyd.db");
db.pragma("journal_mode = WAL");

const WWYD_CHANNELS = "WwydChannels";
const SCORES = "WwydScore";
const USER_SCORES = "UserScore";

db.prepare(
  `CREATE TABLE IF NOT EXISTS ${WWYD_CHANNELS} (guild_id VARCHAR(18) PRIMARY KEY, channel_id VARCHAR(18))`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS ${SCORES} (guild_id VARCHAR(18), discord_id VARCHAR(18), problem_id VARCHAR(16), correct INTEGER, PRIMARY KEY (guild_id, discord_id, problem_id))`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS ${USER_SCORES} (guild_id VARCHAR(18), discord_id VARCHAR(18), score INTEGER, correct INTEGER, attempts INTEGER, PRIMARY KEY (guild_id, discord_id))`,
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

const _INSERT_PROBLEM_SCORE =
  db.prepare(`INSERT INTO ${SCORES} (guild_id, discord_id, problem_id, correct)
              VALUES (@guildId, @discordId, @problemId,
                      @score) ON CONFLICT(guild_id, discord_id, problem_id) DO NOTHING`);

// const _UPDATE_USER_SCORE = db.prepare(`UPDATE ${USER_SCORES}
//               SET score = score + @score
//               WHERE guild_id = @guildId
//                 AND discord_id = @discordId`);

const _UPSERT_USER_SCORE = db.prepare(`
  INSERT INTO ${USER_SCORES} (guild_id, discord_id, score, correct, attempts)
  VALUES (@guildId,
          @discordId,
          @score,
          CASE WHEN @score > 0 THEN 1 ELSE 0 END,
          1) ON CONFLICT(guild_id, discord_id) 
  DO
    UPDATE SET
      score = score + @score,
      correct = correct + (CASE WHEN @score > 0 THEN 1 ELSE 0 END),
      attempts = attempts + 1;
  `);

const
  INSERT_SCORE = db.transaction((inpt) => {
  _INSERT_PROBLEM_SCORE.run(inpt);
  _UPSERT_USER_SCORE.run(inpt);
});

const
  GET_LEADERBOARD = db.prepare(`SELECT *
                                    FROM ${USER_SCORES}
                                    WHERE guild_id = @guildId
                                    ORDER BY score desc LIMIT 10`);

const GET_SCORE = db.prepare(`SELECT score
                              FROM ${USER_SCORES}
                              WHERE guild_id = @guildId
                                AND discord_id = @discordId`);

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

      return 0;
    } else {
      ENABLE_CH.run({
        guildId,
        channelId,
      });

      return 1;
    }
  } catch (err) {
    console.error(err);
    return -1;
  }
};

const addScore = (guildId, discordId, problemId, score) => {
  try {
    if (CHECK_SCORE_EXISTS.get({ guildId, discordId, problemId })) {
      return 0;
    } else {
      INSERT_SCORE({
        guildId,
        discordId,
        problemId,
        score,
      });
      return 1;
    }
  } catch (err) {
    console.error(err);
    return -1;
  }
};

const getLeaderboard = (guildId) => {
  try {
    return GET_LEADERBOARD.all({ guildId });
  } catch (err) {
    console.error(err);
  }
};

const getScore = (guildId, discordId) => {
  try {
    return GET_SCORE.get({ guildId, discordId })?.score ?? 0;
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  getDailyChannels,
  toggleDaily,
  deleteDailyChannels,
  addScore,
  getLeaderboard,
  getScore,
};
