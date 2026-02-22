const { Events, MessageFlags } = require("discord.js");
const { generateAnswerMessage } = require("../wwyd/wwyd_discord");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const buttonData = interaction.customId.split(":");
    if (buttonData[0] !== "wwyd_random") return;
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error("Failed to defer wwyd random reply:", err);
      return;
    }

    const message = await generateAnswerMessage(
      parseInt(buttonData[1]),
      buttonData[3],
    );

    try {
      await interaction.editReply(message);
    } catch (err) {
      console.error("Failed to generate random wwyd:", err);
    }
  },
};
