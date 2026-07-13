const { InteractionContextType, SlashCommandBuilder } = require("discord.js");
const {
  generateLeaderboard,
  generateScore,
  generateHistory,
} = require("../wwyd/wwyd_lb");

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
              "Season stats that you want to fetch, default to current season. Use 0 for total score.",
            ),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription(
              "Leaderboard type that you are querying. Currently supports: score, acc",
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
              "Season stats that you want to fetch, default to current season. Use 0 for total score.",
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
        .setName("history")
        .setDescription("Retrieves your WWYD history.")
        .addBooleanOption((option) =>
          option
            .setName("incorrect")
            .setDescription(
              "Whether you want to only display the WWYDs you answered incorrectly",
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
          options.getString("type"),
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
    } else if (subcommand === "history") {
      await interaction.reply(
        await generateHistory(
          interaction.client.db,
          interaction.guildId,
          interaction.member.id,
          options.getBoolean("incorrect"),
          options.getBoolean("hidden"),
      0,
        ),
      );
    }
  },
};
