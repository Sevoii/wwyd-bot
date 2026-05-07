const { DateTime } = require("luxon");

const wwyd = require("../assets/wwyd.json");

// cache the reverse lookup
const wwydIdx = Object.fromEntries(wwyd.map((item, idx) => [item.source, idx]));

const funnyWwyd = {
  source: "funny-0",
  seat: "E",
  round: "E",
  turn: "1",
  indicator: "5z",
  hand: [
    "1z",
    "1z",
    "2z",
    "2z",
    "3z",
    "3z",
    "4z",
    "5z",
    "5z",
    "5z",
    "6z",
    "6z",
    "6z",
  ],
  draw: "4z",
  answer: "6z",
  comment: ["DREAM FOR THE BIG SEVEN STARS ☄☄☄☄☄☄☄"],
};

const randomWwyd = () => {
  const i = Math.floor(Math.random() * wwyd.length);
  return wwyd[i];
};

const randomWwydDaily = (seed) => {
  const now = DateTime.now().setZone("America/New_York");
  const boundary = now.set({ hour: 9, minute: 59, second: 0, millisecond: 0 });
  const effective = now < boundary ? now.minus({ days: 1 }) : now;

  const offset =
    Math.floor(
      effective.startOf("day").toMillis() / (1000 * 60 * 60 * 24) + 2,
    ) % wwyd.length;

  // 1121 has factors 1,19,59 so just use a number 18-58
  // Factor based on seed so different guilds have different factors if their starting seed is same
  const factor = 18 + (seed % 40);

  const i = (seed + factor * offset) % wwyd.length;

  return wwyd[i];
};

const funnyWwydDaily = (seed) => {
  return funnyWwyd;
};

const isNormalWwyd = (source) => {
  if (Number.isInteger(Number(source))) return source < 0;
  return source.startsWith("funny-");
};

const getWwyd = (i) => {
  // Legacy - to be removed
  if (Number.isInteger(Number(i))) {
    if (isNormalWwyd(i)) {
      return wwyd[parseInt(i)];
    } else {
      return funnyWwyd;
    }
  } else {
    if (isNormalWwyd(i)) {
      const idx = wwydIdx[i];
      if (idx != null) {
        return wwyd[idx];
      } else {
        return null;
      }
    } else {
      return funnyWwyd;
    }
  }
};

module.exports = {
  randomWwyd,
  randomWwydDaily,
  funnyWwydDaily,
  getWwyd,
  isNormalWwyd,
};
