const { InteractionContextType, SlashCommandBuilder } = require("discord.js");
const { generateLeaderboard, generateScore } = require("../wwyd/wwyd_lb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wwyd")
    .setDescription("WWYD Commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Gets the leaderboard for the server")
        .addNumberOption((option) =>
          option
            .setName("season")
            .setDescription(
              "Season stats that you want to fetch, default to current season",
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("score")
        .setDescription("Gets your score in the server")
        .addNumberOption((option) =>
          option
            .setName("season")
            .setDescription(
              "Season stats that you want to fetch, default to current season",
            ),
        )
        .addBooleanOption((option) =>
          option
            .setName("hidden")
            .setDescription(
              "Whether you want the message to be hidden from others or not, defaults to public",
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("season")
        .setDescription("Gets the latest season in the server"),
    )
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const { options } = interaction;

    if (subcommand === "leaderboard") {
      await interaction.reply(
        await generateLeaderboard(
          interaction.client.db,
          interaction.guildId,
          options.getNumber("season"),
        ),
      );
    } else if (subcommand === "score") {
      await interaction.reply(
        await generateScore(
          interaction.client.db,
          interaction.guildId,
          interaction.member.id,
          options.getNumber("season"),
          options.getBoolean("hidden"),
        ),
      );
    } else if (subcommand === "season") {
      let currSeason =
        await interaction.client.db.models.daily_toggle.getLatestSeason(
          interaction.guildId,
        );

      await interaction.reply(`Current season: ${currSeason}`);
    }
  },
};
