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
const { randomWwyd } = require("../wwyd/wwyd_gen");
const EMOJI_MAPPINGS = require("../assets/tori_emoji_mappings.json");

const generateQuestionMessage = async (i, wwyd, ephemeral = false) => {
  const image = await generateWwyd.generateImage(wwyd);
  const options = generateWwyd.getOptions(wwyd);

  const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

  // const embed = new EmbedBuilder()
    // .setTitle(`What would you do?`);
    // .setImage("attachment://wwyd.png");

  const actionRows = [];

  for (let j = 0; j < options.length; j += 5) {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        options.slice(j, j + 5).map((x) =>
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
    // embeds: [embed],
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
