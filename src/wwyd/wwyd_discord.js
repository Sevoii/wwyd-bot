const {
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const sharp = require("sharp");
const path = require("path");

const SEAT_MAPPINGS = {
  E: "\u6771",
  S: "\u5357",
  W: "\u897F",
  N: "\u5317",
};

const EMOJI_MAPPINGS = require("../assets/mjs_emoji_mappings.json");
const { getWwyd } = require("./wwyd_gen");
const { formatAnalysisCompact } = require("./pystyle");

const formatTile = (tile) => {
  return EMOJI_MAPPINGS[tile];
};

const getImagePath = (tile) => {
  // sanitization in case malicious actors or something
  return path.join(__dirname, "../assets/tiles", `${tile.substring(0, 2)}.png`);
};

const generateHeader = ({ seat, round, turn }) =>
  `Round:${SEAT_MAPPINGS[round]}\u2002Seat:${SEAT_MAPPINGS[seat]}\u2002Turn:${turn}`;

const generateImage = async ({ seat, round, turn, indicator, hand, draw }) => {
  const HEADER_HEIGHT = 75;
  const TILE_WIDTH = 80;
  const TILE_GAP = 20;
  const TILE_HEIGHT = 129;
  const DORA_WIDTH = 35;

  hand = hand.slice();
  hand.push(draw);

  const composite = hand.map((x, index) => ({
    input: getImagePath(x),
    left:
      index === hand.length - 1
        ? index * TILE_WIDTH + TILE_GAP
        : index * TILE_WIDTH,
    top: HEADER_HEIGHT,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
  }));

  const header = generateHeader({ seat, round, turn });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="60">
  <text x="0" y="32"
    font-family="monospace"
    font-weight="800"
    font-size="33"
    fill="white"
    stroke="black"
    stroke-width="2"
    paint-order="stroke"
  >${header}</text>
</svg>`;

  composite.push({
    input: Buffer.from(svg),
    left: 20,
    top: 20,
  });

  const indicatorImage = await sharp(getImagePath(indicator))
    .resize({ width: DORA_WIDTH })
    .toBuffer();
  const doraBack = await sharp(getImagePath("tb"))
    .resize({ width: DORA_WIDTH })
    .toBuffer();

  const doraWall = [
    doraBack,
    doraBack,
    indicatorImage,
    doraBack,
    doraBack,
    doraBack,
    doraBack,
  ];

  composite.push(
    ...doraWall.map((image, index) => ({
      input: image,
      left: 480 + index * DORA_WIDTH,
      top: 7,
    })),
  );

  return await sharp({
    create: {
      width: TILE_WIDTH * 14 + TILE_GAP + 10,
      height: TILE_HEIGHT + HEADER_HEIGHT,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite(composite)
    .toFormat("png", { quality: 100 })
    .toBuffer();
};

const generateDescription = ({ comment }, hide = false) => {
  return (
    (hide ? "||" : "") +
    comment
      .map((x) => (x instanceof Array ? x.map(formatTile).join("") : x))
      .join("") +
    (hide ? "||" : "")
  );
};

const suitOrder = { m: 0, p: 1, s: 2, z: 3 };

const getOptions = ({ hand, draw }) => {
  hand = hand.slice();
  hand.push(draw);
  hand.sort((a, b) => {
    const [iA, sA] = [parseInt(a[0], 10), a[1]];
    const [iB, sB] = [parseInt(b[0], 10), b[1]];
    if (suitOrder[sA] !== suitOrder[sB]) {
      return suitOrder[sA] - suitOrder[sB];
    }
    return iA - iB;
  });
  return hand.filter((item, index) => hand.indexOf(item) === index);
};

const getWwydUUID = ({ source }) => {
  const date = new Date();
  return date.toISOString().slice(0, 10).replace(/-/g, "") + "-" + source;
};

const STYLE_MAPPING = {
  m: ButtonStyle.Danger,
  p: ButtonStyle.Secondary,
  s: ButtonStyle.Success,
};

const generateQuestionMessage = async (wwyd, label, ephemeral = false) => {
  const image = await generateImage(wwyd);
  const options = getOptions(wwyd);

  const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

  // const embed = new EmbedBuilder()
  // .setTitle(`What would you do?`);
  // .setImage("attachment://wwyd.png");

  const actionRows = [];

  const uuid = getWwydUUID(wwyd);

  for (let j = 0; j < options.length; j += 5) {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        options.slice(j, j + 5).map((x) =>
          new ButtonBuilder()
            .setCustomId(`${label}:${wwyd.source}:${uuid}:${x}`)
            .setLabel(x)
            // .setEmoji(EMOJI_MAPPINGS[x])
            .setStyle(STYLE_MAPPING[x[1]] ?? ButtonStyle.Primary),
        ),
      ),
    );
  }

  actionRows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${label}:${wwyd.source}:${uuid}:na`)
        .setLabel("pass")
        .setStyle(ButtonStyle.Primary),
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

const generateAnswerMessage = async (internalId, answer, hide = false) => {
  const wwyd = getWwyd(internalId);

  const image = await generateImage(wwyd);
  const description = generateDescription(wwyd, hide);

  const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

  const embed = new EmbedBuilder()
    .setTitle(
      `Answer: ${hide ? "||" : ""}${Array.isArray(wwyd.answer) ? wwyd.answer.map(formatTile).join(",") : formatTile(wwyd.answer)}${hide ? "||" : ""}`,
    )
    .setDescription(description)
    // .setFields([
    //   {
    //     name: "Explanation",
    //     value: description,
    //     inline: false,
    //   },
    // ])
    .setColor(
      answer === "na" ? "Blue" : wwyd.answer.includes(answer) ? "Green" : "Red",
    )
    .setFooter({
      text: `Source: ${wwyd.source}`,
    });

  let embeds = [embed];

  try {
    // const pystyleResp = await analyzeWWYDSituation(i, wwyd);
    const pystyleResp = wwyd.pystyle;
    if (pystyleResp != null) {
      embeds.push(
        new EmbedBuilder().addFields({
          name: "Pystyle Analysis",
          value: formatAnalysisCompact(pystyleResp, 10, hide),
        }),
      );
    }
  } catch (err) {
    console.error(err);
  }

  return {
    embeds,
    files: [wwydImg],
    flags: MessageFlags.Ephemeral,
    components: [],
  };
};

module.exports = {
  generateImage,
  generateHeader,
  generateDescription,
  getOptions,
  generateQuestionMessage,
  generateAnswerMessage,
  getWwydUUID,
};
