const { EmbedBuilder, MessageFlags } = require("discord.js");

const generateLeaderboard = async (db, guildId, season, type) => {
  if (season == null) {
    season = await db.models.daily_toggle.getLatestSeason(guildId);
    if (season === -1) {
      return {
        content: "Failed to find latest season",
      };
    }
  }

  let lb;
  if (type === "acc") {
    lb = await db.models.daily_scores.getLeaderboardAcc(guildId, season);
  } else {
    lb = await db.models.daily_scores.getLeaderboard(guildId, season);
  }

  const embed = new EmbedBuilder()
    .setTitle("WWYD Leaderboard")
    .setDescription(
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
    )
    .setFooter({
      text: season !== 0 ? `Season: ${season}` : "Total",
    });
  return {
    embeds: [embed],
  };
};

const generateScore = async (db, guildId, discordId, season, hidden) => {
  if (season == null) {
    season = await db.models.daily_toggle.getLatestSeason(guildId);
    if (season === -1) {
      return {
        content: "Failed to find latest season",
      };
    }
  }

  const streak = await db.models.daily_scores.getStreak(guildId, discordId);

  const score = await db.models.daily_scores.getScore(
    guildId,
    discordId,
    season,
  );

  if (score != null && streak != null) {
    const message = {
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
              name: "Accuracy",
              value: `\`${(score.score / score.attempts * 100).toFixed(2)}\`%`,
              inline: true,
            },
            {
              name: "Streak",
              value: `\`${streak.streak}\` ${streak.streak >= 10 ? "🚀" : streak.streak >= 5 ? "🔥" : ""}`,
              inline: true,
            },
            {
              name: "Best Streak",
              value: `\`${streak.best_streak}\``,
              inline: true,
            },
          )
          // .setDescription(`<@${discordId}>'s Score: ${score.score}`)
          .setColor("Green")
          .setFooter({
            text: season !== 0 ? `Season: ${season}` : "Total",
          }),
      ],
    };

    if (hidden) {
      message.flags = MessageFlags.Ephemeral;
    }

    return message;
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
