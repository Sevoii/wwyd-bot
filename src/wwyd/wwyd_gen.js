const { DateTime } = require("luxon");

const wwyd = require("../assets/wwyd.json");

// cache the reverse lookup
const wwydIdx = Object.fromEntries(wwyd.map((item, idx) => [item.source, idx]));

const TILES = [
  "1m",
  "2m",
  "3m",
  "4m",
  "0m",
  "5m",
  "6m",
  "7m",
  "8m",
  "9m",
  "1p",
  "2p",
  "3p",
  "4p",
  "0p",
  "5p",
  "6p",
  "7p",
  "8p",
  "9p",
  "1s",
  "2s",
  "3s",
  "4s",
  "0s",
  "5s",
  "6s",
  "7s",
  "8s",
  "9s",
  "1z",
  "2z",
  "3z",
  "4z",
  "5z",
  "6z",
  "7z",
];

// Easy deterministic permutation
const ALL_PERMS = [
  [0, 1, 2],
  [2, 0, 1],
  [2, 1, 0],
  [1, 0, 2],
  [1, 2, 0],
  [0, 2, 1],
];

const SUITS = ["manzu", "pinzu", "souzu"];

const getShuffledTile = (idx, seed = 0) => {
  // Don't shuffle any honor tiles (dragons are shuffleable, but unnecessary)
  if (idx >= 30) return idx;

  const suit = Math.floor(idx / 10);
  const num = idx % 10;

  const permutation = ALL_PERMS[seed % 6];

  return permutation[suit] * 10 + num;
};

// fix all the tile in a wwyd
const fixWwyd = (wwyd, seed) => {
  const fixed = structuredClone(wwyd);
  fixed.seed = seed;

  fixed.problem.indicator =
    TILES[getShuffledTile(fixed.problem.indicator, seed)];
  fixed.problem.draw = TILES[getShuffledTile(fixed.problem.draw, seed)];
  fixed.problem.hand = fixed.problem.hand
    .map((x) => getShuffledTile(x, seed))
    .toSorted((a, b) => a - b)
    .map((x) => TILES[x]);
  fixed.problem.answer = fixed.problem.answer.map(
    (x) => TILES[getShuffledTile(x, seed)],
  );
  fixed.problem.comment = fixed.problem.comment.map((x) => {
    if (x.type === "text") {
      return x.data;
    } else if (x.type === "suit") {
      const permutation = ALL_PERMS[seed % 6];
      return SUITS[permutation[x.data]];
    } else if (x.type === "tile") {
      return x.data.map((y) => TILES[getShuffledTile(y, seed)]);
    }
  });

  if (fixed.pystyle) {
    fixed.pystyle = fixed.pystyle.map((x) => {
      x.tile = TILES[getShuffledTile(x.tile, seed)];
      x.wait_types = x.wait_types
        .map((y) => getShuffledTile(y, seed))
        .toSorted((a, b) => a - b)
        .map((y) => TILES[y]);
      return x;
    });
  }

  if (fixed.naga) {
    fixed.naga.data = fixed.naga.data.map((x) => {
      x.tile = TILES[getShuffledTile(x.tile, seed)];
      return x;
    });

    fixed.naga.t_test.tiles = fixed.naga.t_test.tiles.map(
      (y) => TILES[getShuffledTile(y, seed)],
    );
  }

  return fixed;
};

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

const unknownWwyd = {
  source: "unknown",
  seat: "E",
  round: "E",
  turn: "1",
  indicator: "tb",
  hand: [
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
    "tb",
  ],
  draw: "tb",
  answer: "na",
  comment: ["Unable to find wwyd."],
};

const randomWwyd = (shuffleSeed = 0) => {
  const i = Math.floor(Math.random() * wwyd.length);
  return fixWwyd(wwyd[i], shuffleSeed);
};

const randomWwydDaily = (seed, shuffleSeed = 0) => {
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

  return fixWwyd(wwyd[i], shuffleSeed);
};

const funnyWwydDaily = (seed) => {
  return funnyWwyd;
};

const isNormalWwyd = (source) => {
  if (Number.isInteger(Number(source))) return source >= 0; // legacy id
  return !source.startsWith("funny-") && source !== "unknown"; // source is an id
};

const getWwyd = (i, seed = 0) => {
  // Legacy - to be removed
  if (Number.isInteger(Number(i))) {
    if (isNormalWwyd(i)) {
      return fixWwyd(wwyd[parseInt(i)], seed);
    } else {
      return funnyWwyd;
    }
  } else {
    if (isNormalWwyd(i)) {
      const idx = wwydIdx[i];
      if (idx != null) {
        return fixWwyd(wwyd[idx], seed);
      } else {
        return unknownWwyd;
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
