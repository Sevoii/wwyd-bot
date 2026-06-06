const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  LabelBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const createReportModal = async (buttonId) => {
  const source = buttonId.slice(buttonId.indexOf("-") + 1);

  const modal = new ModalBuilder()
    .setCustomId("reportModal")
    .setTitle("Report an Issue");

  const sourceInput = new TextInputBuilder()
    .setCustomId("source")
    .setStyle(TextInputStyle.Short)
    .setValue(source);

  const wwydSourceLabel = new LabelBuilder()
    .setLabel("WWYD Source:")
    .setTextInputComponent(sourceInput);

  const reportType = new StringSelectMenuBuilder()
    .setCustomId("type")
    .setPlaceholder("Make a selection")
    .setRequired(true)
    .addOptions(
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
      new StringSelectMenuOptionBuilder()
        .setLabel("My answer was wrong!")
        .setDescription(
          "Use this if there's no issues but you want to complain to me :>",
        )
        .setValue("mad"),
    );

  const wwydReportTypeLabel = new LabelBuilder()
    .setLabel("Why did you report an issue?")
    .setStringSelectMenuComponent(reportType);

  const info = new TextInputBuilder()
    .setCustomId("info")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Add any extra information you'd like here")
    .setRequired(false)
    .setMaxLength(1024);

  const infoLabel = new LabelBuilder()
    .setLabel("Extra Info")
    .setTextInputComponent(info);

  modal.addLabelComponents(wwydSourceLabel, wwydReportTypeLabel, infoLabel);

  return modal;
};

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const buttonId = interaction.customId;

    if (buttonId.startsWith("report-")) {
      const modal = await createReportModal(buttonId);
      await interaction.showModal(modal);
    }
  },
};
