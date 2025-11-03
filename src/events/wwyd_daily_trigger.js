const { randomWwyd } = require("../wwyd/wwyd_gen");
const {
  generateQuestionMessage,
  generateAnswerMessage,
  getWwydUUID,
} = require("../wwyd/wwyd_discord");
const {
  getDailyChannels,
  deleteDailyChannels,
  setLatestWwyd,
  getPrevStats,
} = require("../wwyd/wwyd_db");
const { EmbedBuilder } = require("discord.js");

const sendWwydMessage = async (client, guildId, channel) => {
  const [i, wwyd] = randomWwyd();
  const uuid = getWwydUUID(i, wwyd);

  const prevData = getPrevStats(guildId);
  if (prevData) {
    const channel = await client.channels.fetch(prevData.channelId);

    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(prevData.messageId);
      if (message) {
        await message.edit(
          await generateAnswerMessage(prevData.internalId, null, true),
        );
      } else {
        console.error("Message not found");
      }
    }

    if (prevData.attempts !== 0) {
      try {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("WWYD Daily Recap")
              .setDescription(
                `Successes: ${prevData.successes} - Failures: ${prevData.attempts - prevData.successes} - ${Math.floor((prevData.successes / prevData.attempts) * 100)}%\nGuess Distribution: ${Object.entries(
                  prevData.answerCounts,
                )
                  .sort(([keyA], [keyB]) => keyB.localeCompare(keyA)) // sort keys Z → A
                  .map(([key, value]) => `${key}:${value}`)
                  .join(", ")}`,
              )
              .addFields({
                name: "Answerers",
                value: prevData.answerers
                  .map(
                    (x, i) => `${i + 1}. <@${x.discord_id}> - ${x.score} pts`,
                  )
                  .join("\n"),
              }),
          ],
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  const message = await generateQuestionMessage(i, wwyd, "wwyd_daily");
  const sent = await channel.send(message);

  setLatestWwyd(guildId, uuid, i, channel.id, sent.id);
};

module.exports = {
  name: "WWYD_Daily",
  once: false,
  async execute(client, channel) {
    console.log("Daily WWYD Sent Out");

    if (channel) {
      await sendWwydMessage(client, channel.guild.id, channel);
    } else {
      const to_delete = [];

      for (let entry of getDailyChannels()) {
        const channel = await client.channels.fetch(entry.channel_id);

        if (channel && channel.isTextBased()) {
          await sendWwydMessage(client, entry.guild_id, channel);
        } else {
          to_delete.push(channel);
        }
      }

      deleteDailyChannels(to_delete);
    }
  },
};
