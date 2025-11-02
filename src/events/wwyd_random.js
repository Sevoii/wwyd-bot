const { Events, MessageFlags } = require("discord.js");
const { generateAnswerMessage } = require("../wwyd/generate_wwyd");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const buttonData = interaction.customId.split(":");
    if (buttonData[0] !== "wwyd_random") return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const message = await generateAnswerMessage(
      parseInt(buttonData[1]),
      buttonData[3],
    );

    await interaction.editReply(message);
  },
};
