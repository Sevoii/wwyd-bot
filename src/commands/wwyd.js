const { SlashCommandBuilder } = require("discord.js");
const generateWwyd = require("../wwyd/generate_wwyd");
const { randomWwyd } = require("../wwyd/wwyd_gen");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wwyd")
    .setDescription("WWYD Commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("random")
        .setDescription(
          "Generates a random WWYD that does not count towards the leaderboard",
        ),
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "random") {
      const [i, wwyd] = randomWwyd();

      const message = await generateWwyd.generateQuestionMessage(
        i,
        wwyd,
        "wwyd_random",
        true,
      );
      // const message = await generateQuestionMessageNoHeader(i, wwyd, true);
      await interaction.reply(message);
    }
  },
};
