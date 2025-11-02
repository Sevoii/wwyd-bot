const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getLeaderboard, getScore } = require("./wwyd_db");

const generateLeaderboard = (guildId) => {
  const lb = getLeaderboard(guildId);

  const embed = new EmbedBuilder()
    .setTitle("WWYD Leaderboard")
    .setDescription(
      lb
        .map(
          (x, i) =>
            `${i + 1}. <@${x.discord_id}> — ${x.score} pts • ${x.attempts} attempts • ${Math.round((x.correct / x.attempts) * 100)}%`,
        )
        .join(",\n"),
    );

  return {
    embeds: [embed],
  };
};

const generateScore = (guildId, discordId) => {
  const score = getScore(guildId, discordId);

  if (score != null) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle("WWYD Daily Score")
          .setDescription(`<@${discordId}>'s Score: ${score}`)
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
