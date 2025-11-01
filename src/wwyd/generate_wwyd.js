const sharp = require("sharp");
const path = require("node:path");

const MAPPINGS = {
  E: "東",
  S: "南",
  W: "西",
  N: "北"
};

const generateImage = async ({ seat, round, turn, indicator, hand, draw }) => {
  return sharp("../assets/wwyd_base.png").composite(hand.map((x, i) => {
    return {
      input: path.join("../assets/tiles", `${x}.png`),
      top: 74,
      left: i * 80
    };
  }).concat([
    {
      input: path.join("../assets/tiles", `${draw}.png`),
      top: 74,
      left: 1060
    },
    {
      input: await sharp(path.join("../assets/tiles", `${indicator}.png`)).resize(35, 56).toBuffer(),
      top: 7,
      left: 550
    },
    {
      input: {
        text: {
          text: `<span foreground="white"><b>Round:${MAPPINGS[round]} Seat:${MAPPINGS[seat]} Turn:${turn}</b></span>`,
          dpi: 200,
          rgba: true,
          font: "monospace"
        }
      },
      left: 20,
      top: 20
    }
  ]));
};

const generateDescription = ({ comment }) => {
  return comment.map(x => x instanceof Array ? x.map(x => `:${x}:`).join(",") : x).join("");
};

module.exports = {
  generateImage,
  generateDescription
};