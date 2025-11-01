const sharp = require("sharp");
const path = require("node:path");

const MAPPINGS = {
  E: "東",
  S: "南",
  W: "西",
  N: "北",
};

const generateImage = async ({ seat, round, turn, indicator, hand, draw }) => {
  const HEADER_HEIGHT = 75;
  const TILE_WIDTH = 80;
  const TILE_GAP = 20;
  const TILE_HEIGHT = 129;
  const DORA_WIDTH = 35;

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
        text: `<span foreground="white"><b>Round:${MAPPINGS[round]} Seat:${MAPPINGS[seat]} Turn:${turn}</b></span>`,
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

const generateNoHeaderImage = async ({
  seat,
  round,
  turn,
  indicator,
  hand,
  draw,
}) => {
  const TILE_WIDTH = 80;
  const TILE_GAP = 20;
  const TILE_HEIGHT = 129;

  hand.push(draw);

  const composite = hand.map((x, index) => ({
    input: path.join(__dirname, "../assets/tiles", `${x}.png`),
    left:
      index === hand.length - 1
        ? index * TILE_WIDTH + TILE_GAP
        : index * TILE_WIDTH,
    top: 0,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
  }));

  return await sharp({
    create: {
      width: TILE_WIDTH * 14 + TILE_GAP + 10,
      height: TILE_HEIGHT,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite(composite)
    .toFormat("png", { quality: 100 })
    .toBuffer();
};

const generateDescription = ({ comment }) => {
  return comment
    .map((x) => (x instanceof Array ? x.map((x) => `:${x}:`).join(",") : x))
    .join("");
};

const suitOrder = { m: 0, p: 1, s: 2, z: 3 };

const getOptions = ({ hand, draw }) => {
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

module.exports = {
  generateImage,
  generateDescription,
  getOptions,
};
