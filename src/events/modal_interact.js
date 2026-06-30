const { Events, MessageFlags } = require("discord.js");

const handleReportModal = async (interaction) => {
  await interaction.reply({
    content:
      "Thank you for your report! We have logged this in our system, and we will address it soon.",
    flags: MessageFlags.Ephemeral,
  });

  const source = interaction.fields.getTextInputValue("source");
  const reportType = interaction.fields.getStringSelectValues("type");
  const info = interaction.fields.getTextInputValue("info");
  const reporter = interaction.user;

  // TEMP REPORTING CODE

  const msg = `\`\`\`ansi\nReporter: \u001b[1;34m${reporter.username} (${reporter.id})\u001b[0m\nSource: \u001b[1;32m${source}\u001b[0m\nReport Type: \u001b[1;32m${reportType}\u001b[0m\nInfo: \u001b[1;32m${info}\u001b[0m\`\`\``;
  console.log(msg);

  const guild = await interaction.client.guilds.fetch(
    process.env.DISCORD_REPORT_GUILD_ID,
  );
  const channel = await guild?.channels.fetch(
    process.env.DISCORD_REPORT_CHANNEL_ID,
  );

  if (channel) {
    await channel.send(msg);
  }
};

const handleConfigModal = async (interaction) => {
  const channel =
    interaction.fields.getSelectedChannels("wwydchannel")?.values().next()
      .value ?? null;
  const autoseason = interaction.fields.getCheckbox("autoseason") | 0;
  const pingoncorrect = interaction.fields.getCheckbox("pingoncorrect") | 0;
  const forcewwyd = interaction.fields.getCheckbox("forcewwyd");

  if (channel) {
    await interaction.client.db.models.daily_toggle.enableGuildChannel(
      interaction.guildId,
      channel.id,
      autoseason,
      pingoncorrect,
    );

    if (forcewwyd) {
      interaction.client.emit("WWYD_Daily", interaction.client, channel);
    }
  } else {
    await interaction.client.db.models.daily_toggle.deleteGuildChannel(
      interaction.guildId,
    );
  }

  await interaction.reply({
    content: `Received Config request: channel: ${channel}, AutoSeason: ${!!autoseason}, Ping On Correct: ${!!pingoncorrect}`,
    ephemeral: true,
  });
};

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === "reportModal") {
      await handleReportModal(interaction);
    } else if (interaction.customId === "configMenu") {
      await handleConfigModal(interaction);
    }
  },
};
