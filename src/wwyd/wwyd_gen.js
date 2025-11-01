const wwyd = require("../assets/wwyd.json");

const randomWwyd = () => {
  const i = Math.floor(Math.random() * wwyd.length);
  return [i, wwyd[i]];
};

const getWwyd = (i) => {
  return wwyd[i];
};


module.exports = {
  randomWwyd,
  getWwyd
}