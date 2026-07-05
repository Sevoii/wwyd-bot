const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  CheckboxBuilder,
  CheckboxGroupBuilder,
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
    .addSubcommand((subcommand) =>
      subcommand.setName("new_season").setDescription("Creates a new season"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("auto_season")
        .setDescription("Toggles autoseason for the server"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("menu").setDescription("WWYD Menu Config"),
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

        interaction.client.emit(
          "WWYD_Daily",
          interaction.client,
          interaction.channel,
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
    } else if (subcommand === "new_season") {
      let res = await interaction.client.db.models.daily_toggle.stageNewSeason(
        interaction.guildId,
      );

      if (res === 1) {
        await interaction.reply("OK");
      } else {
        await interaction.reply("Failed to set new season, try again");
      }
    } else if (subcommand === "auto_season") {
      let res =
        await interaction.client.db.models.daily_toggle.toggleAutoseason(
          interaction.guildId,
        );

      if (res === 1 || res === 0) {
        await interaction.reply("Autoseason toggled " + ["off", "on"][res]);
      } else {
        await interaction.reply("Failed to set new season, try again");
      }
    } else if (subcommand === "menu") {
      const channelData =
        await interaction.client.db.models.daily_toggle.getGuildData(
          interaction.guildId,
        );

      const modal = new ModalBuilder()
        .setCustomId("configMenu")
        .setTitle("Configuration");

      const wwydChannelBuilder = new ChannelSelectMenuBuilder()
        .setCustomId("wwydchannel")
        .setMinValues(0)
        .setMaxValues(1)
        .setRequired(false)
        .setChannelTypes([ChannelType.GuildText]);

      if (channelData) {
        wwydChannelBuilder.setDefaultChannels(channelData?.channel_id);
      }

      const wwydChannel = new LabelBuilder()
        .setLabel("WWYD Channel")
        .setDescription(
          "Select the channel you want to send daily WWYD's in. Deselect if you want to turn it off.",
        )
        .setChannelSelectMenuComponent(wwydChannelBuilder);

      const wwydPingBuilder = new RoleSelectMenuBuilder()
        .setCustomId("wwydping")
        .setMinValues(0)
        .setMaxValues(1)
        .setRequired(false);

      if (
        channelData?.dailyping &&
        (await interaction.guild.roles.cache.get(channelData.dailyping))
      ) {
        wwydPingBuilder.setDefaultRoles(channelData.dailyping);
      }

      const wwydPing = new LabelBuilder()
        .setLabel("Daily Ping")
        .setDescription(
          "Select a role to ping when the Daily WWYD is sent out.",
        )
        .setRoleSelectMenuComponent(wwydPingBuilder);

      const checkboxBuilder = new CheckboxGroupBuilder()
        .setCustomId("toggleable")
        .setOptions([
          {
            label: "Auto Season",
            description:
              "Automatically resets the season at the start of every month.",
            value: "autoseason",
            default: !!(channelData?.autoseason ?? false),
          },
          {
            label: "Ping on Correct",
            description: "Pings the answerer if they answered correct.",
            value: "pingoncorrect",
            default: !!(channelData?.pingoncorrect ?? true),
          },
          {
            label: "Daily Leaderboard",
            description: "Sends a daily leaderboard with the new wwyd.",
            value: "dailyleaderboard",
            default: !!(channelData?.dailyleaderboard ?? false),
          },
          {
            label: "Force Send a WWYD",
            description: "Sends a WWYD to the selected channel.",
            value: "forcewwyd",
            default: false,
          },
        ])
        .setRequired(false);

      const checkboxLabel = new LabelBuilder()
        .setLabel("Toggleable Features")
        .setCheckboxGroupComponent(checkboxBuilder);

      modal.addLabelComponents(wwydChannel, wwydPing, checkboxLabel);

      await interaction.showModal(modal);
    }
  },
};
