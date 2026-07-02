const { SlashCommandBuilder } = require("discord.js");
const { generateQuestionMessage } = require("../wwyd/wwyd_discord");
const { randomWwyd, getWwyd } = require("../wwyd/wwyd_gen");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wwyd_random")
    .setDescription(
      "Generates a random WWYD that does not count towards the leaderboard",
    )
    .addStringOption((option) =>
      option.setName("problemid").setDescription("WWYD Problem Source").setRequired(false),
    ),
  async execute(interaction) {
    const problemId = interaction.options.getString("problemid");

    const message = await generateQuestionMessage(
      problemId == null ? randomWwyd() : getWwyd(problemId),
      "wwyd_random",
      true,
    );
    await interaction.reply(message);
  },
};
