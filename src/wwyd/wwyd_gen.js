const wwyd = require("../assets/wwyd.json");

const funnyWwyd = {
  source: "I blame Entree for not giving me a better question",
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
  return [i, wwyd[i]];
};

const randomWwydDaily = (seed) => {
  const offset = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % wwyd.length;

  // 568 has factors 1,2,71 so just use an odd number 9-69
  // Factor based on seed so different guilds have different factors if their starting seed is same
  const factor = 9 + (seed % 30) * 2;

  const i = (seed + factor * offset) % wwyd.length;

  return [i, wwyd[i]];
};

const funnyWwydDaily = (seed) => {
  return [-1, funnyWwyd];
};

const getWwyd = (i) => {
  if (i === -1) {
    return funnyWwyd;
  } else {
    return wwyd[i];
  }
};

module.exports = {
  randomWwyd,
  randomWwydDaily,
  funnyWwydDaily,
  getWwyd,
};
