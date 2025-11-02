const { Events, MessageFlags, EmbedBuilder } = require("discord.js");
const { generateAnswerMessage } = require("../wwyd/generate_wwyd");
const { getWwyd } = require("../wwyd/wwyd_gen");
const { addScore } = require("../wwyd/wwyd_db");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const buttonData = interaction.customId.split(":");
    if (buttonData[0] !== "wwyd_daily") return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const message = await generateAnswerMessage(
      parseInt(buttonData[1]),
      buttonData[3],
    );

    const correct = buttonData[3] === getWwyd(parseInt(buttonData[1])).answer;
    const res = addScore(
      interaction.guildId,
      interaction.member.id,
      buttonData[2],
      buttonData[3],
      correct ? 1 : 0,
    );

    if (res === -1) {
      await interaction.editReply({
        content: "Could not save score to the database, please try again",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      message.embeds.push(
        new EmbedBuilder()
          .setTitle(
            res === 1
              ? "Successfully saved score to database"
              : "You already answered today",
          )
          .setColor(res === 1 ? "Green" : "Red"),
      );

      await interaction.editReply(message);

      if (res === 1 && correct) {
        await interaction.channel.send(
          `<@${interaction.member.id}> was correct!`,
        );
      }
    }
  },
};
