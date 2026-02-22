const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wwyd_config")
    .setDescription("WWYD Config - Requires Manage Channels Permission to use")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Toggles daily WWYD for the server"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("force")
        .setDescription("Forces the bot to send a daily WWYD in the channel"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageChannels")) {
      await interaction.reply({
        content: "You need the Manage Channels permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "toggle") {
      const res = await interaction.client.db.models.daily_toggle.toggleDaily(
        interaction.guildId,
        interaction.channelId,
      );
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
    } else if (subcommand === "force") {
      await interaction.reply("OK");
      interaction.client.emit(
        "WWYD_Daily",
        interaction.client,
        interaction.channel,
      );
    }
  },
};
