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

    const date = new Date();
    const isAprilFirst = date.getMonth() === 3 && date.getDay() === 1;

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error(
        `Could not defer wwyd daily reply in guild ${interaction.guildId} from ${interaction.member.id}`,
        err,
      );
      return;
    }

    const wwydId = parseInt(buttonData[1]);
    const correct = buttonData[3] === getWwyd(wwydId).answer;
    const isPass = buttonData[3] === "na";
    let res;

    if (wwydId >= 0) {
      res = await interaction.client.db.models.daily_answers.addAnswer(
        interaction.guildId,
        interaction.member.id,
        buttonData[2],
        buttonData[3],
        correct ? 1 : 0,
        isPass,
      );
    } else {
      res = 1;
    }

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

      return;
    }

    const message = await generateAnswerMessage(
      parseInt(buttonData[1]),
      buttonData[3],
    );

    if (!isPass) {
      if (wwydId >= 0) {
        message.embeds.push(
          new EmbedBuilder()
            .setTitle(
              res === 1
                ? "Successfully saved score to database"
                : "You already answered today",
            )
            .setColor(res === 1 ? "Green" : "Red"),
        );
      } else {
        message.embeds.push(new EmbedBuilder().setTitle("hi").setColor("Red"));
      }
    }

    try {
      await interaction.editReply(message);
    } catch (err) {
      console.error(
        `Could not edit interaction message (proper response) in guild ${interaction.guildId} from ${interaction.member.id}`,
        err,
      );
      return;
    }

    if (res === 1 && correct && !(wwydId < 0 && !isAprilFirst)) {
      try {
        let season =
          await interaction.client.db.models.daily_toggle.getLatestSeason(
            interaction.guildId,
          );
        let score = (await interaction.client.db.models.daily_scores.getScore(
          interaction.guildId,
          interaction.member.id,
          season,
        )) ?? { streak: 0 };

        let msg = `<@${interaction.member.id}> got it right!`;

        if (wwydId < 0 && correct) {
          score.streak = 999;
        }

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
  },
};
