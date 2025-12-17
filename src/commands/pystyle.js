const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const {
  analyzeWWYDSituation,
  formatAnalysisCompact,
} = require("../wwyd/wwyd_pystyle");

const parseTiles = (hand) => {
  const result = [];
  let curr = [];

  for (let i of hand) {
    if (i >= "0" && i <= "9") {
      curr.push(i);
    } else {
      result.push(...curr.map((x) => x + i));
      curr = [];
    }
  }

  return result;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pystyle")
    .setDescription("PYStyle API")
    .addStringOption((option) =>
      option.setName("hand").setDescription("Mahjong Hand").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("seat_wind")
        .setDescription("seat wind (E, S, W, N)")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(1)
        .addChoices(
          { name: "East", value: "E" },
          { name: "South", value: "S" },
          { name: "West", value: "W" },
          { name: "North", value: "N" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("round_wind")
        .setDescription("Select a round wind (E, S, W, N)")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(1)
        .addChoices(
          { name: "East", value: "E" },
          { name: "South", value: "S" },
          { name: "West", value: "W" },
          { name: "North", value: "N" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("dora_indicator")
        .setDescription("Dora Indicator")
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(2),
    )
    .addNumberOption((option) => option.setName("turn").setDescription("current turn")),
  async execute(interaction) {
    const hand = interaction.options.getString("hand");
    const turn = interaction.options.getNumber("turn") || 1;
    const tiles = parseTiles(hand);
    const doraIndicator = interaction.options.getString("dora_indicator");

    if (tiles.length !== 14) {
      return await interaction.reply({
        content: "invalid hand " + tiles.join(""),
        ephemeral: true,
      });
    }

    const isValid = /^[0-9][mps]$|^[1-7]z$/.test(doraIndicator);
    if (!isValid) {
      return await interaction.reply({
        content: "invalid dora indicator " + doraIndicator,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const wwyd = {
      seat: interaction.options.getString("seat_wind"),
      round: interaction.options.getString("round_wind"),
      turn,
      indicator: doraIndicator,
      hand: tiles,
    };

    const response = await analyzeWWYDSituation(0, wwyd, false);
    if (response) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().addFields({
            name:
              "Pystyle Analysis on " +
              hand +
              " dora " +
              doraIndicator +
              " turn " +
              turn,
            value: formatAnalysisCompact(response, 10, false),
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.editReply("could not call api");
    }
  },
};
