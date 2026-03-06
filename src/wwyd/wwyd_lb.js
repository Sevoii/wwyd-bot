const { EmbedBuilder, MessageFlags } = require("discord.js");

const generateLeaderboard = async (db, guildId) => {
  const lb = await db.models.daily_scores.getLeaderboard(guildId, 1);

  const embed = new EmbedBuilder().setTitle("WWYD Leaderboard").setDescription(
    lb
      .map((x, i) => {
        let base = `${i + 1}. <@${x.discord_id}> — `;

        let parts = [];

        parts.push(`${x.score} pts`);

        if (x.streak >= 5) {
          parts[0] += ` (${x.streak} ${x.streak >= 10 ? "🚀" : "🔥"})`;
        }

        parts.push(`${x.attempts} attempts`);
        parts.push(`${Math.round((x.score / x.attempts) * 100)}%`);

        return base + parts.join(" • ");
      })
      .join("\n") + "\n",
  );

  return {
    embeds: [embed],
  };
};

const generateScore = async (db, guildId, discordId) => {
  const score = await db.models.daily_scores.getScore(guildId, discordId, 1);

  if (score != null) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle("WWYD Daily Score")
          .addFields(
            { name: "Score", value: `\`${score.score}\``, inline: true },
            {
              name: "Attempts",
              value: `\`${score.attempts}\``,
              inline: true,
            },
            {
              name: "Streak",
              value: `\`${score.streak}\` ${score.streak >= 10 ? "🚀" : score.streak >= 5 ? "🔥" : ""}`,
              inline: true,
            },
            {
              name: "Best Streak",
              value: `\`${score.best_streak}\``,
              inline: true,
            },
          )
          // .setDescription(`<@${discordId}>'s Score: ${score.score}`)
          .setColor("Green"),
      ],
    };
  } else {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle("Could not get your score, please try again")
          .setColor("Red"),
      ],
      flags: MessageFlags.Ephemeral,
    };
  }
};

module.exports = {
  generateLeaderboard,
  generateScore,
};
