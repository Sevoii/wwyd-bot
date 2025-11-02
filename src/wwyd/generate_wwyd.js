const {
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const sharp = require("sharp");
const path = require("node:path");

const SEAT_MAPPINGS = {
  E: "\u6771",
  S: "\u5357",
  W: "\u897F",
  N: "\u5317",
};

const EMOJI_MAPPINGS = require("../assets/personal_emoji_mappings.json");
const { getWwyd } = require("./wwyd_gen");
const {
  analyzeWWYDSituation,
  formatAnalysisCompact,
} = require("./wwyd_pystyle");

const generateHeader = ({ seat, round, turn }) =>
  `Round:${SEAT_MAPPINGS[round]} Seat:${SEAT_MAPPINGS[seat]} Turn:${turn}`;

const generateImage = async ({ seat, round, turn, indicator, hand, draw }) => {
  const HEADER_HEIGHT = 75;
  const TILE_WIDTH = 80;
  const TILE_GAP = 20;
  const TILE_HEIGHT = 129;
  const DORA_WIDTH = 35;

  hand = hand.slice();
  hand.push(draw);

  const composite = hand.map((x, index) => ({
    input: path.join(__dirname, "../assets/tiles", `${x}.png`),
    left:
      index === hand.length - 1
        ? index * TILE_WIDTH + TILE_GAP
        : index * TILE_WIDTH,
    top: HEADER_HEIGHT,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
  }));

  composite.push({
    input: {
      text: {
        text: `<span foreground="white"><b>${generateHeader({ seat, round, turn })}</b></span>`,
        dpi: 200,
        rgba: true,
        font: "monospace",
      },
    },
    left: 20,
    top: 20,
  });

  const indicatorImage = await sharp(
    path.join(__dirname, "../assets/tiles", `${indicator}.png`),
  )
    .resize({ width: DORA_WIDTH })
    .toBuffer();
  const doraBack = await sharp(
    path.join(__dirname, "../assets/tiles", `tile_back.png`),
  )
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

  // return sharp(path.join(__dirname, "../assets/wwyd_base.png")).composite(hand.map((x, i) => {
  //   return {
  //     input: path.join(__dirname, "../assets/tiles", `${x}.png`),
  //     top: 74,
  //     left: i * 80
  //   };
  // }).concat([
  //   {
  //     input: path.join(__dirname, "../assets/tiles", `${draw}.png`),
  //     top: 74,
  //     left: 1060
  //   },
  //   {
  //     input: await sharp(path.join(__dirname, "../assets/tiles", `${indicator}.png`)).resize(35, 56).toBuffer(),
  //     top: 7,
  //     left: 550
  //   },
  //   {
  //     input: {
  //       text: {
  //         text: `<span foreground="white"><b>Round:${MAPPINGS[round]} Seat:${MAPPINGS[seat]} Turn:${turn}</b></span>`,
  //         dpi: 200,
  //         rgba: true,
  //         font: "monospace"
  //       }
  //     },
  //     left: 20,
  //     top: 20
  //   }
  // ]));
};

const generateDescription = ({ comment }, hide = false) => {
  return (
    (hide ? "||" : "") +
    comment
      .map((x) =>
        x instanceof Array
          ? x.map((x) => `<:${x}:${EMOJI_MAPPINGS[x]}>`).join("")
          : x,
      )
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

const getWwydUUID = (i, wwyd) => {
  const date = new Date();
  return date.toISOString().slice(0, 10).replace(/-/g, "") + "-" + i;
};

const STYLE_MAPPING = {
  m: ButtonStyle.Danger,
  p: ButtonStyle.Secondary,
  s: ButtonStyle.Success,
};

const generateQuestionMessage = async (i, wwyd, label, ephemeral = false) => {
  const image = await generateImage(wwyd);
  const options = getOptions(wwyd);

  const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

  // const embed = new EmbedBuilder()
  // .setTitle(`What would you do?`);
  // .setImage("attachment://wwyd.png");

  const actionRows = [];

  const uuid = getWwydUUID(i, wwyd);

  for (let j = 0; j < options.length; j += 5) {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        options.slice(j, j + 5).map((x) =>
          new ButtonBuilder()
            .setCustomId(`${label}:${i}:${uuid}:${x}`)
            .setLabel(x)
            // .setEmoji(EMOJI_MAPPINGS[x])
            .setStyle(STYLE_MAPPING[x[1]]),
        ),
      ),
    );
  }

  actionRows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${label}:${i}:${uuid}:na`)
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

const generateAnswerMessage = async (i, answer, hide = false) => {
  const wwyd = getWwyd(i);

  const image = await generateImage(wwyd);
  const description = generateDescription(wwyd, hide);

  const wwydImg = new AttachmentBuilder(image, { name: "wwyd.png" });

  const embed = new EmbedBuilder()
    .setTitle(`Answer: ${hide ? "||" : ""}${wwyd.answer}${hide ? "||" : ""}`)
    .setFields([
      {
        name: "Explanation",
        value: description,
        inline: false,
      },
    ])
    .setColor(answer === wwyd.answer ? "Green" : "Red");

  let embeds = [embed];

  try {
    const pystyleResp = await analyzeWWYDSituation(i, wwyd);
    if (pystyleResp) {
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
