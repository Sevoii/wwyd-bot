const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const EMOJI_MAPPINGS = {
  MJS: require("../assets/mjs_emoji_mappings.json"),
  FLUFFY: require("../assets/fluffy_emoji_mappings.json"),
  TEXT: require("../assets/text_mappings.json"),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testemoji")
    .setDescription("Internal command to test emojis")
    .addStringOption((option) =>
      option
        .setName("set")
        .setDescription("emoji types")
        .setRequired(true)
        .addChoices(
          { name: "MJS", value: "MJS" },
          { name: "FLUFFY", value: "FLUFFY" },
          { name: "TEXT", value: "TEXT" },
        ),
    ),
  async execute(interaction) {
    const setName = interaction.options.getString("set");
    const mapping = EMOJI_MAPPINGS[setName];

    if (!mapping) {
      return interaction.reply({
        content: "Invalid emoji set.",
        ephemeral: true,
      });
    }

    const lines = Object.entries(mapping).map(
      ([key, emoji]) => `\`${key}\` → ${emoji}`,
    );

    const description = lines.join("\n").slice(0, 4096);

    const embed = new EmbedBuilder()
      .setTitle(`${setName} Emoji Preview`)
      .setDescription(description)
      .setColor(0x5865f2);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
