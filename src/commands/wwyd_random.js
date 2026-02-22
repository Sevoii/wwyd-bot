const { SlashCommandBuilder } = require("discord.js");
const { generateQuestionMessage } = require("../wwyd/wwyd_discord");
const { randomWwyd } = require("../wwyd/wwyd_gen");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wwyd_random")
    .setDescription(
      "Generates a random WWYD that does not count towards the leaderboard",
    ),
  async execute(interaction) {
    const [i, wwyd] = randomWwyd();

    const message = await generateQuestionMessage(i, wwyd, "wwyd_random", true);
    await interaction.reply(message);
  },
};
