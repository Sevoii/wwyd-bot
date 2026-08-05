const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  AttachmentBuilder,
} = require("discord.js");
const {
  fetchData,
  getAnalysis,
  renderImage,
  formatAnalysisCompact,
} = require("../wwyd/naga");

const toLegacyAnalysis = (columns, analysis) => {
  const simData = columns.map((c, i) => ({
    tile: c.dahai + (c.wReach ? "(r)" : ""),
    mean: c.kyokuBp.mean,
    var: c.kyokuBp.var,
    win: c.hora / c.numSims,
    num_sims: c.numSims,
    _ev: analysis.roundEV[i], // carried along for the t-test, stripped below
  }));
  simData.sort((a, b) => b.mean - a.mean);

  const legacy = { data: simData };

  if (simData.length >= 2) {
    const best = simData[0]._ev;
    const second = simData[1]._ev;
    const v1 = best.se ** 2;
    const v2 = second.se ** 2;
    const df =
      (v1 + v2) ** 2 / (v1 ** 2 / (best.n - 1) + v2 ** 2 / (second.n - 1));

    legacy.t_test = {
      tiles: [simData[0].tile, simData[1].tile],
      t: second.z,
      df,
      p: second.p,
    };
  }

  for (const d of simData) delete d._ev;
  return legacy;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("naga")
    .setDescription("Formats and Sends a Naga Simulation")
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("url")
        .setDescription("Naga Simulation URL"),
    ),
  async execute(interaction) {
    const url = interaction.options.getString("url");

    if (!url.startsWith("https://naga.dmv.nico/htmls/simulation_viewer.html")) {
      return await interaction.reply({
        content: "Invalid url, please try again",
        ephemeral: true,
      });
    }

    const sentMessage = await interaction.deferReply();

    // fetch columns -> analyze
    let columns, analysis;
    try {
      const simIds = new URL(url).searchParams
        .get("sim_ids")
        .split(",")
        .map((d) => d.split("_")[0]);
      columns = await Promise.all(simIds.map(fetchData));
      analysis = getAnalysis(columns);
    } catch (err) {
      console.error(err);
      return await interaction.editReply({
        content: "Failed to get Naga data, please try again",
      });
    }

    const message = {
      embeds: [
        new EmbedBuilder()
          .setURL(url)
          .setTitle("NAGA Analysis")
          .setDescription(
            formatAnalysisCompact(toLegacyAnalysis(columns, analysis)),
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`naga-delete`)
            .setLabel("Delete")
            .setEmoji("🗑️")
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    };

    try {
      const buf = await renderImage(columns, analysis);
      message.files = [new AttachmentBuilder(buf, { name: "naga.png" })];
    } catch (err) {
      console.error("naga render failed:", err);
    }

    await interaction.editReply(message);

    const collector = sentMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    let flag = false;
    collector.on("collect", (i) => {
      if (i.user.id === interaction.user.id) {
        interaction.deleteReply().catch(console.error);
        flag = true;
      } else {
        i.reply({
          content: `You cannot delete this message`,
          flags: MessageFlags.Ephemeral,
        }).catch(console.error);
      }
    });

    collector.on("end", () => {
      if (!flag) {
        interaction.editReply({ components: [] }).catch(console.error);
      }
    });
  },
};
