const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  LabelBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { generateHistory } = require("../wwyd/wwyd_lb");

const createReportModal = async (source) => {
  const modal = new ModalBuilder()
    .setCustomId("reportModal")
    .setTitle("Report an Issue");

  const wwydSourceLabel = new LabelBuilder()
    .setLabel("WWYD Source:")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("source")
        .setStyle(TextInputStyle.Short)
        .setValue(source),
    );

  const wwydReportTypeLabel = new LabelBuilder()
    .setLabel("Why did you report an issue?")
    .setStringSelectMenuComponent(
      new StringSelectMenuBuilder()
        .setCustomId("type")
        .setPlaceholder("Make a selection")
        .setRequired(true)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("My answer was wrong!")
            .setDescription(
              "Use this if the correct solution had a reasonable explanation but you want to complain",
            )
            .setValue("mad"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Description Issues")
            .setDescription("There is some problem in the problem description")
            .setValue("description"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Incorrect Answer")
            .setDescription("The answer makes no sense and needs to be checked")
            .setValue("answer"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Misc")
            .setDescription("Miscellaneous issues")
            .setValue("misc"),
        ),
    );

  const infoLabel = new LabelBuilder()
    .setLabel("Extra Info")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("info")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Add any extra information you'd like here")
        .setRequired(false)
        .setMaxLength(1024),
    );

  // I think it looks ugly if we put it all in the addLabelComponents
  modal.addLabelComponents(wwydSourceLabel, wwydReportTypeLabel, infoLabel);

  return modal;
};

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const components = interaction.customId.split(":");
    const action = components.shift();

    if (action === "report") {
      const modal = await createReportModal(components[1]);
      await interaction.showModal(modal);
    } else if (action === "wwyd_history") {
      const [skip, incorrect, hidden] = components;

      const message = await generateHistory(
        interaction.client.db,
        interaction.guildId,
        interaction.user.id,
        incorrect === "1",
        hidden === "1",
        parseInt(skip),
      );

      if (hidden === "1") {
        await interaction.reply(message);
      } else {
        await interaction.message.edit(message);
        await interaction.deferUpdate();
      }
    }
  },
};
