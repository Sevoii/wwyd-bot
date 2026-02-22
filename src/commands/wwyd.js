const { InteractionContextType, SlashCommandBuilder } = require("discord.js");
const { generateLeaderboard, generateScore } = require("../wwyd/wwyd_lb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wwyd")
    .setDescription("WWYD Commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Gets the leaderboard for the server"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("score")
        .setDescription("Gets your score in the server"),
    )
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "leaderboard") {
      await interaction.reply(
        await generateLeaderboard(interaction.client.db, interaction.guildId),
      );
    } else if (subcommand === "score") {
      await interaction.reply(
        await generateScore(
          interaction.client.db,
          interaction.guildId,
          interaction.member.id,
        ),
      );
    }
  },
};
