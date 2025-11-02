const { randomWwyd } = require("../wwyd/wwyd_gen");
const {
  generateQuestionMessage,
  getWwydUUID,
} = require("../wwyd/generate_wwyd");
const {
  getDailyChannels,
  deleteDailyChannels,
  setLatestWwyd,
  getPrevStats,
} = require("../wwyd/wwyd_db");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "WWYD_Daily",
  once: false,
  async execute(client) {
    console.log("Daily WWYD Sent Out");

    const to_delete = [];

    for (let entry of getDailyChannels()) {
      const channel = await client.channels.fetch(entry.channel_id);

      if (channel && channel.isTextBased()) {
        const [i, wwyd] = randomWwyd();
        const uuid = getWwydUUID(i, wwyd);

        const prevData = getPrevStats(entry.guild_id);
        if (prevData && prevData.attempts !== 0) {
          try {
            await channel.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle("WWYD Daily Recap")
                  .setDescription(
                    `Successes: ${prevData.successes} - Failures: ${prevData.attempts - prevData.successes} - ${Math.floor((prevData.successes / prevData.attempts) * 100)}% \n\n` +
                      prevData.answerers
                        .map((x, i) => `${i + 1}. <@${x.discord_id}> - ${x.score} pts`)
                        .join("\n"),
                  ),
              ],
            });
          } catch (err) {
            console.error(err);
          }
        }

        setLatestWwyd(entry.guild_id, uuid);

        const message = await generateQuestionMessage(i, wwyd, "wwyd_daily");
        await channel.send(message);
      } else {
        to_delete.push(channel);
      }
    }

    deleteDailyChannels(to_delete);
  },
};
