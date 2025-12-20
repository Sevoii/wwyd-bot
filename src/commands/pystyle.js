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
    .setDescription("Evalutes an inputted hand using PyStyle")
    .addStringOption((option) =>
      option.setName("hand").setDescription("Base Mahjong Hand (13 Tiles)").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("draw").setDescription("Drawn tile").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("seat_wind")
        .setDescription("Seat Wind (E, S, W, N)")
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
        .setDescription("Round wind (E, S, W, N)")
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
        .setDescription("Dora Indicator [NOT DORA]")
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(2),
    )
    .addNumberOption((option) => option.setName("turn").setDescription("Current Turn")),
  async execute(interaction) {
    const hand = interaction.options.getString("hand");
    const draw = interaction.options.getString("draw");
    const turn = interaction.options.getNumber("turn") || 1;
    const tiles = parseTiles(hand);
    const doraIndicator = interaction.options.getString("dora_indicator");

    if (tiles.length !== 13) {
      return await interaction.reply({
        content: "Invalid Hand " + tiles.join("") + ", expected 13 tiles but received " + tiles.length + " tiles",
        ephemeral: true,
      });
    }

    const tileRe = /^[0-9][mps]$|^[1-7]z$/;

    if (!tileRe.test(doraIndicator)) {
      return await interaction.reply({
        content: "Invalid Dora Indicator: " + doraIndicator,
        ephemeral: true,
      });
    }

    if (!tileRe.test(draw)) {
      return await interaction.reply({
        content: "Invalid Drawn Tile: " + draw,
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
      draw
    };

    const response = await analyzeWWYDSituation(0, wwyd);
    if (response) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().addFields({
            name:
              "Pystyle Analysis on " +
              hand + draw +
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
      await interaction.editReply("PyStyle API returned an error");
    }
  },
};
