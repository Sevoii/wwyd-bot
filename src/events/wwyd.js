const {
  Events,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
} = require("discord.js");
const { generateDescription, generateImage } = require("../wwyd/generate_wwyd");
const { getWwyd } = require("../wwyd/wwyd_gen");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const buttonData = interaction.customId.split(":");
    if (buttonData[0] !== "wwyd_random" && buttonData[0] !== "wwyd_daily")
      return;

    await interaction.deferReply({ ephemeral: true });

    const wwyd = getWwyd(parseInt(buttonData[1]));

    const image = await generateImage(wwyd);
    const description = generateDescription(wwyd);

    const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

    const embed = new EmbedBuilder()
      .setTitle(`Answer: ${wwyd.answer}`)
      .setFields([
        {
          name: "Explanation",
          value: description,
          inline: false,
        },
      ])
      .setColor(buttonData[3] === wwyd.answer ? "Green" : "Red");

    await interaction.editReply({
      embeds: [embed],
      files: [wwydImg],
      flags: MessageFlags.Ephemeral,
    });
  },
};
