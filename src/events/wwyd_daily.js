const { randomWwyd } = require("../wwyd/wwyd_gen");
const { generateQuestionMessage } = require("../wwyd/generate_wwyd");
const { getDailyChannels, deleteDailyChannels } = require("../wwyd/wwyd_db");

module.exports = {
  name: "WWYD_Daily",
  once: false,
  async execute(client) {
    console.log("WWYD Sent Out");

    const to_delete = [];

    for (let entry of getDailyChannels()) {
      const channel = await client.channels.fetch(entry.channel_id);

      if (channel && channel.isTextBased()) {
        const [i, wwyd] = randomWwyd();
        const message = await generateQuestionMessage(i, wwyd, "wwyd_daily");

        await channel.send(message);
      } else {
        to_delete.push(channel);
      }
    }

    deleteDailyChannels(to_delete);
  },
};
