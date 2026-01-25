const wwyd = require("../assets/wwyd.json");

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

const getWwyd = (i) => {
  return wwyd[i];
};

module.exports = {
  randomWwyd,
  randomWwydDaily,
  getWwyd,
};
