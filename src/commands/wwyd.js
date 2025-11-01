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
        options
          .slice(i, i + 5)
          .map((x) =>
            new ButtonBuilder()
              .setCustomId(`wwyd_random:${i}:${x}`)
              .setLabel(x)
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
      await interaction.reply(message);
    }
  },
};
