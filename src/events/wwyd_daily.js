const { Events, MessageFlags, EmbedBuilder } = require("discord.js");
const { generateAnswerMessage } = require("../wwyd/wwyd_discord");
const { getWwyd } = require("../wwyd/wwyd_gen");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const buttonData = interaction.customId.split(":");
    if (buttonData[0] !== "wwyd_daily") return;

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error(
        `Could not defer wwyd daily reply in guild ${interaction.guildId} from ${interaction.member.id}`,
        err,
      );
      return;
    }

    const message = await generateAnswerMessage(
      parseInt(buttonData[1]),
      buttonData[3],
    );

    const correct = buttonData[3] === getWwyd(parseInt(buttonData[1])).answer;
    const res = await interaction.client.db.models.daily_answers.addAnswer(
      interaction.guildId,
      interaction.member.id,
      buttonData[2],
      buttonData[3],
      correct ? 1 : 0,
      buttonData[3] === "na",
    );

    if (res === -1) {
      try {
        await interaction.editReply({
          content: "Could not save score to the database, please try again",
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        console.error(
          `Could not edit interaction message (db score failure) in guild ${interaction.guildId} from ${interaction.member.id}`,
          err,
        );
      }
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

      try {
        await interaction.editReply(message);
      } catch (err) {
        console.error(
          `Could not edit interaction message (proper response) in guild ${interaction.guildId} from ${interaction.member.id}`,
          err,
        );
        return;
      }

      if (res === 1 && correct) {
        try {
          let score = await interaction.client.db.models.daily_scores.getScore(
            interaction.guildId,
            interaction.member.id,
          );

          let msg = `<@${interaction.member.id}> got it right!`;

          if (score && score.streak >= 3) {
            msg += `\n-# Answer Streak: ${score.streak} ${score.streak > 10 ? "🚀" : "🔥"}`;
          }

          await interaction.channel.send(msg);
        } catch (err) {
          console.error(
            `Could not send correct answer message in ${interaction.guildId} from ${interaction.member.id}`,
            err,
          );
        }
      }
    }
  },
};
