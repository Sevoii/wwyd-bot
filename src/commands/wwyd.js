const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { generateQuestionMessage } = require("../wwyd/generate_wwyd");
const { randomWwyd } = require("../wwyd/wwyd_gen");
const { toggleDaily } = require("../wwyd/wwyd_db");
const { generateLeaderboard, generateScore } = require("../wwyd/wwyd_lb");

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
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("daily")
        .setDescription("Configure daily WWYD options")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("toggle")
            .setDescription("Toggles daily WWYD for the server"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("leaderboard")
            .setDescription("Gets the leaderboard for the server"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("score")
            .setDescription("Gets your score in the server"),
        ),
    ),
  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "random") {
      const [i, wwyd] = randomWwyd();

      const message = await generateQuestionMessage(
        i,
        wwyd,
        "wwyd_random",
        true,
      );
      await interaction.reply(message);
    } else if (subcommandGroup === "daily") {
      if (subcommand === "toggle") {
        if (!interaction.member.permissions.has("ManageChannels")) {
          await interaction.reply({
            content:
              "You need the Manage Channels permission to use this command.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        const res = toggleDaily(interaction.guildId, interaction.channelId);
        if (res === 1) {
          await interaction.reply(
            `Successfully enabled WWYD in <#${interaction.channelId}>`,
          );
        } else if (res === 0) {
          await interaction.reply(
            `Successfully disabled WWYD in <#${interaction.channelId}>`,
          );
        } else {
          await interaction.reply("Internal Error, please try again");
        }
      } else if (subcommand === "leaderboard") {
        await interaction.reply(generateLeaderboard(interaction.guildId));
      } else if (subcommand === "score") {
        await interaction.reply(
          generateScore(interaction.guildId, interaction.member.id),
        );
      }
    }
  },
};
