const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const generateWwyd = require("../wwyd/generate_wwyd");
const wwyd = require("../assets/wwyd.json");

const randomWwyd = () => {
  const i = Math.floor(Math.random() * wwyd.length);
  return [i, wwyd[i]];
};

const getWwyd = (i) => {
  return wwyd[i];
};

const EMOJI_MAPPINGS = {
  "0m": "518612982284943400",
  "1m": "518612995207725056",
  "2m": "518612994767323147",
  "3m": "518612991529320452",
  "4m": "518612993773404171",
  "5m": "518612993953759242",
  "6m": "518612991348965379",
  "7m": "518612994779906048",
  "8m": "518612986311606293",
  "9m": "518612991537709058",
  "0p": "518612982050193408",
  "1p": "518612996470079498",
  "2p": "518612985732923403",
  "3p": "518612993832124437",
  "4p": "518612995031433234",
  "5p": "518612985598705664",
  "6p": "518612996222877725",
  "7p": "518612983874846721",
  "8p": "518612996310958080",
  "9p": "518612984608587791",
  "0s": "518612982775676948",
  "1s": "518612996306763776",
  "2s": "518612993454505985",
  "3s": "518612994167537675",
  "4s": "518612991739166730",
  "5s": "518612995522297876",
  "6s": "518612988584919070",
  "7s": "518612986688962560",
  "8s": "518612995539075083",
  "9s": "518612984910839810",
  "1z": "518612994914254848",
  "2z": "518612987087552512",
  "3z": "518612991407685652",
  "4z": "518612991537840131",
  "5z": "518612990594121731",
  "6z": "518612994465202206",
  "7z": "518612994523922442",
};

const generateQuestionMessage = async (i, wwyd, ephemeral = false) => {
  const image = await generateWwyd.generateImage(wwyd);
  const options = generateWwyd.getOptions(wwyd);

  const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

  const embed = new EmbedBuilder()
    .setTitle(`What would you do?`)
    .setImage("attachment://wwyd.png");

  const actionRows = [];

  for (let i = 0; i < options.length; i += 5) {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        options.slice(i, i + 5).map((x) =>
          new ButtonBuilder()
            .setCustomId(`wwyd_random:${i}:${x}`)
            .setLabel(x)
            // .setEmoji(EMOJI_MAPPINGS[x])
            .setStyle(ButtonStyle.Primary),
        ),
      ),
    );
  }

  actionRows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`wwyd:${i}:pass`)
        .setLabel("pass")
        .setStyle(ButtonStyle.Danger),
    ),
  );

  const message = {
    embeds: [embed],
    files: [wwydImg],
    components: actionRows,
  };

  if (ephemeral) {
    message.flags = MessageFlags.Ephemeral;
  }

  return message;
};

const generateQuestionMessageNoHeader = async (i, wwyd, ephemeral = false) => {
  const image = await generateWwyd.generateNoHeaderImage(wwyd);
  const options = generateWwyd.getOptions(wwyd);

  const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

  const embed = new EmbedBuilder()
    .setTitle(`What would you do?`)
    .setDescription(generateWwyd.generateHeader(wwyd))
    .setImage("attachment://wwyd.png");

  const actionRows = [];

  for (let i = 0; i < options.length; i += 5) {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        options.slice(i, i + 5).map((x) =>
          new ButtonBuilder()
            .setCustomId(`wwyd_random:${i}:${x}`)
            // .setLabel(x)
            .setEmoji(EMOJI_MAPPINGS[x])
            .setStyle(ButtonStyle.Primary),
        ),
      ),
    );
  }

  actionRows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`wwyd:${i}:pass`)
        .setLabel("pass")
        .setStyle(ButtonStyle.Danger),
    ),
  );

  const message = {
    embeds: [embed],
    files: [wwydImg],
    components: actionRows,
  };

  if (ephemeral) {
    message.flags = MessageFlags.Ephemeral;
  }

  return message;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wwyd")
    .setDescription("WWYD Commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("random")
        .setDescription(
          "Generates a random WWYD that does not count towards the leaderboard",
        ),
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "random") {
      const [i, wwyd] = randomWwyd();

      const message = await generateQuestionMessage(i, wwyd, true);
      // const message = await generateQuestionMessageNoHeader(i, wwyd, true);
      await interaction.reply(message);
    }
  },
};
