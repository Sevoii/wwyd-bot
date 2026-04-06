const { funnyWwydDaily, randomWwydDaily } = require("../wwyd/wwyd_gen");
const {
  generateQuestionMessage,
  generateAnswerMessage,
  getWwydUUID,
} = require("../wwyd/wwyd_discord");
const { EmbedBuilder } = require("discord.js");

const sendWwydMessage = async (client, guildId, channel, funny = false) => {
  const [i, wwyd] = funny
    ? funnyWwydDaily(parseInt(guildId.substring(1, 10)))
    : randomWwydDaily(parseInt(guildId.substring(1, 10)));
  const uuid = getWwydUUID(i, wwyd);

  const prevData = await client.db.models.daily_message.getPrevStats(guildId);
  if (prevData && i >= 0) {
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
        await prevChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("WWYD Daily Recap")
              .setDescription(
                `Successes: ${prevData.successes} - Total: ${prevData.attempts} - Success Rate: ${Math.floor((prevData.successes / prevData.attempts) * 100)}%\nGuess Distribution: ${Object.entries(
                  prevData.answerCounts,
                )
                  .sort(([keyA], [keyB]) => keyB.localeCompare(keyA)) // sort keys Z → A
                  .map(([key, value]) => `${key}:${value}`)
                  .join(", ")}`,
              )
              .setColor("#d9a441"),
            // .setColor("Green")
            // .addFields({
            //   name: "Correct Answerers",
            //   value: prevData.answerers
            //     .map(
            //       (x, i) => `${i + 1}. <@${x.discord_id}> - ${x.score} pts`,
            //     )
            //     .join("\n"),
            // }),
          ],
        });
      } catch (err) {
        console.error(
          `Could not send wwyd message stats for guild ${guildId}`,
          err,
        );
      }
    }
  }

  const message = await generateQuestionMessage(i, wwyd, "wwyd_daily");

  try {
    const sent = await channel.send(message);
    if (i >= 0) {
      await client.db.models.daily_message.setLatestWwyd(
        guildId,
        uuid,
        i,
        channel.id,
        sent.id,
      );
    }

    return true;
  } catch (err) {
    console.error(
      `Could not send new wwyd for guild ${guildId} in channel ${channel.id}`,
      err,
    );

    return false;
  }
};

module.exports = {
  name: "WWYD_Daily",
  once: false,
  async execute(client, channel) {
    console.log("Daily WWYD Sent Out");

    const date = new Date();
    const isAprilFirst = date.getMonth() === 3 && date.getDate() === 1;

    if (channel) {
      await sendWwydMessage(client, channel.guild.id, channel, isAprilFirst);
    } else {
      // A new day! Updates the seasons for all servers
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
          channel?.isTextBased() &&
          !(await sendWwydMessage(
            client,
            entry.guild_id,
            channel,
            isAprilFirst,
          ))
        ) {
          to_delete.push(channel);
        }
      }

      await client.db.models.daily_toggle.deleteDailyChannels(to_delete);
    }
  },
};
