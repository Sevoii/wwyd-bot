const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  AttachmentBuilder,
} = require("discord.js");
const {
  getAnalysis,
  formatAnalysisCompact,
  fetchScreenshot,
} = require("../wwyd/naga");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("naga")
    .setDescription("Formats and Sends a Naga Simulation")
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("url")
        .setDescription("Naga Simulation URL"),
    )
    .addAttachmentOption((option) =>
      option.setName("image").setDescription("Use a custom image instead of the default screenshot"),
    ),
  async execute(interaction) {
    const url = interaction.options.getString("url");
    const attachment = interaction.options.getAttachment("image");

    if (!url.startsWith("https://naga.dmv.nico/htmls/simulation_viewer.html")) {
      return await interaction.reply({
        content: "Invalid url, please try again",
        ephemeral: true,
      });
    }

    if (attachment != null && !attachment.contentType.startsWith("image/")) {
      return await interaction.reply({
        content: "Attached file is not an image, please try again",
        ephemeral: true,
      });
    }

    const sentMessage = await interaction.deferReply();

    const data = await getAnalysis(url);
    if (!data) {
      return await interaction.editReply({
        content: "Failed to get Naga data, please try again",
        ephemeral: true,
      });
    }

    const message = {
      embeds: [
        new EmbedBuilder()
          .setURL(url)
          .setTitle("NAGA Analysis")
          .setDescription(formatAnalysisCompact(data)),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`naga-delete`)
            .setLabel("Delete")
            .setEmoji("🗑️")
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    };

    if (attachment) {
      message.files = [attachment.url];
    } else {
      let buf = null;
      // try 3 times to fetch screenshot data
      for (let i = 0; i < 3; i++) {
        buf = await fetchScreenshot(url);
        if (buf) break;
      }

      if (buf) {
        const file = new AttachmentBuilder(buf, { name: "naga.png" });
        message.files = [file];
      }
    }

    await interaction.editReply(message);

    const collector = sentMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    let flag = false;
    collector.on("collect", (i) => {
      if (i.user.id === interaction.user.id) {
        interaction.deleteReply().catch(console.error);
        flag = true;
      } else {
        i.reply({
          content: `You cannot delete this message`,
          flags: MessageFlags.Ephemeral,
        }).catch(console.error);
      }
    });

    collector.on("end", () => {
      if (!flag) {
        interaction.editReply({ components: [] }).catch(console.error);
      }
    });
  },
};
