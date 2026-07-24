const {
  funnyWwydDaily,
  randomWwydDaily,
  isNormalWwyd,
} = require("../wwyd/wwyd_gen");
const {
  generateQuestionMessage,
  generateAnswerMessage,
  generateRecapEmbed,
  getWwydUUID,
} = require("../wwyd/wwyd_discord");
const { generateLeaderboard } = require("../wwyd/wwyd_lb");
const { ThreadAutoArchiveDuration } = require("discord.js");

// Split this into distinct stages:
//   1. Edit Old Messages
//   2. Send Leaderboards Out
//   3. Stage & Commit the Seasons
//   4. Send out a message (wwyd, daily ping, new season alert?)

const editPrevWWYD = async (client, channel) => {
  const guildId = channel.guildId;
  if (guildId == null) return;
  const prevData = await client.db.models.daily_message.getPrevStats(guildId);
  if (!prevData) return;

  let prevChannel;

  try {
    prevChannel = await client.channels.fetch(prevData.channelId);
  } catch (err) {
    console.error(`Could not fetch prev channel for guildId ${guildId}`, err);
  }

  if (prevChannel?.isTextBased()) {
    let message;
    try {
      message = await prevChannel.messages.fetch(prevData.messageId);
    } catch (err) {
      console.error(`Could not read prev channel wwyd force, skipping`, err);
    }
    if (message) {
      try {
        await message.edit(
          await generateAnswerMessage(prevData.internalId, null, true),
        );
      } catch (err) {
        console.error(
          `Could not edit message ${prevData.messageId} for guild ${guildId}`,
          err,
        );
      }
    } else {
      console.error(
        `Message not found ${prevData.messageId} for guild ${guildId}`,
      );
    }
  }

  if (prevData.attempts !== 0) {
    try {
      await prevChannel.send(
        generateRecapEmbed(
          prevData.successes,
          prevData.attempts,
          prevData.answerCounts,
        ),
      );
    } catch (err) {
      console.error(
        `Could not send wwyd message stats for guild ${guildId}`,
        err,
      );
    }
  }
};

const sendLeaderboard = async (client, channel) => {
  const leaderboard = await generateLeaderboard(client.db, channel.guildId);
  try {
    await channel.send(leaderboard);
  } catch (err) {
    console.error(`Tried to send leaderboard but failed`, err);
  }
};

const stageAndCommitSeason = async (client, channel) => {
  await client.db.models.daily_toggle.stageNewSeason(channel.guildId, 1);
};

const sendMessage = async (client, channel, wwyd, dailyping) => {
  const guildId = channel.guildId;
  if (guildId == null) return;

  const uuid = getWwydUUID(wwyd);
  const message = await generateQuestionMessage(
    wwyd,
    "wwyd_daily",
    false,
    dailyping,
  );

  let sent;
  for (let k = 0; k < 3; k++) {
    try {
      sent = await channel.send(message);
      if (isNormalWwyd(wwyd.source)) {
        await client.db.models.daily_message.setLatestWwyd(
          guildId,
          uuid,
          wwyd.source,
          channel.id,
          sent.id,
        );
      }

      break;
    } catch (err) {
      console.error(
        `Attempt ${k + 1}: Could not send new wwyd for guild ${guildId} in channel ${channel.id}`,
        err,
      );
    }
  }

  if (sent) {
    try {
      await sent.startThread({
        name: `${new Date()
          .toLocaleString("en-US", {
            timeZone: "America/New_York",
          })
          .slice(0, 10)} Discussion Thread`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      });
    } catch (err) {
      console.error(
        `Attempted to create a discussion thread for guild ${guildId} in channel ${channel.id}`,
        err,
      );
    }
  }

  return Boolean(sent);
};

const sendDailyWwyd = async (
  client,
  channel,
  channelData,
  funny = false,
  shouldAutoseason = false,
) => {
  if (!funny) {
    await editPrevWWYD(client, channel);
  }

  if (channelData?.dailyleaderboard) {
    await sendLeaderboard(client, channel);
  }

  if (shouldAutoseason) {
    await stageAndCommitSeason(client, channel);
  }

  const guildId = channel.guildId;

  const wwyd = funny
    ? funnyWwydDaily(parseInt(guildId.substring(1, 10)))
    : randomWwydDaily(parseInt(guildId.substring(1, 10)));

  return await sendMessage(client, channel, wwyd, channelData?.dailyping);
};

module.exports = {
  name: "WWYD_Daily",
  once: false,
  async execute(client, channel) {
    console.log("Daily WWYD Sent Out");

    const date = new Date();
    const isAprilFirst = date.getMonth() === 3 && date.getDate() === 1; // for april fools
    const shouldAutoseason = date.getDate() === 1; // for autoseason

    if (channel) {
      // Force WWYD in a specific channel
      const channelData = await client.db.models.daily_toggle.getGuildData(
        channel.guildId,
      );
      await sendDailyWwyd(client, channel, channelData, isAprilFirst, false);
    } else {
      await client.db.models.daily_toggle.commitNewSeasons();

      const to_delete = [];

      for (let entry of await client.db.models.daily_toggle.getDailyChannels()) {
        let channel;
        try {
          channel = await client.channels.fetch(entry.channel_id);
        } catch (err) {
          console.error(
            `Could not get channel for guild ${entry.guild_id} channelid ${entry.channel_id}\n`,
            err,
          );
        }

        if (
          !channel?.isTextBased() ||
          !(await sendDailyWwyd(
            client,
            channel,
            entry,
            isAprilFirst,
            shouldAutoseason,
          ))
        ) {
          to_delete.push(entry.channel_id);
          console.log(`Channel Error for ${entry.guild_id}`);
        }
      }

      await client.db.models.daily_toggle.deleteDailyChannels(to_delete);
    }
  },
};
