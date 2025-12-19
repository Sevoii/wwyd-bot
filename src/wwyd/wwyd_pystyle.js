const axios = require("axios");
const { MessageFlags } = require("discord.js");

const API_URL = "https://pystyle.info/apps/mahjong-cpp_0.9.1/post.py";

function convertTileToNumber(tile) {
  if (!/^[0-9][mpsz]$/.test(tile)) {
    throw new Error(`Invalid tile format: ${tile}`);
  }

  if (tile === "0m") return 34;
  if (tile === "0p") return 35;
  if (tile === "0s") return 36;

  const suitDelta = { m: -1, p: 8, s: 17, z: 26 };

  return parseInt(tile[0]) + suitDelta[tile[1]];
}

function convertNumberToTile(tile) {
  if (tile < 0 || tile > 36) {
    throw new Error(`Invalid tile number: ${tile}`);
  }

  //Aka tiles
  if (tile === 34) return "0m";
  if (tile === 35) return "0p";
  if (tile === 36) return "0s";

  if (tile < 9) {
    return `${tile + 1}m`;
  } else if (tile < 18) {
    return `${tile - 8}p`;
  } else if (tile < 27) {
    return `${tile - 17}s`;
  } else if (tile < 34) {
    return `${tile - 26}z`;
  }

  throw new Error(`Invalid tile number: ${tile}`);
}

function generateWall(tiles) {
  const wall = new Array(37).fill(4);
  //red five separation
  wall[34] = wall[35] = wall[36] = 1;
  // the regular 5 counts are used as the total 5 counts

  for (const tile of tiles) {
    if (tile < wall.length && wall[tile] > 0) {
      wall[tile]--;
    }
    if (tile === 34) wall[4]--;
    if (tile === 35) wall[13]--;
    if (tile === 36) wall[22]--;
  }

  return wall;
}

function convertWwydToApiFormat(wwyd) {
  // Convert hand tiles (13 tiles) and draw tile (1 tile) to numbers
  const handTiles = wwyd.hand.map(convertTileToNumber);
  const drawTile = convertTileToNumber(wwyd.draw);
  const allHandTiles = [...handTiles, drawTile];

  // Convert dora indicator
  const doraIndicator = convertTileToNumber(wwyd.indicator);

  // Convert winds
  const roundWind = { E: 27, S: 28 }[wwyd.round];
  const seatWind = { E: 27, S: 28, W: 29, N: 30 }[wwyd.seat];
  const wall = generateWall([...allHandTiles, doraIndicator]);

  return {
    enable_reddora: true,
    enable_uradora: true,
    enable_shanten_down: true,
    enable_tegawari: true,
    enable_riichi: false,
    round_wind: roundWind,
    dora_indicators: [doraIndicator],
    hand: allHandTiles,
    melds: [],
    seat_wind: seatWind,
    wall: wall,
    version: "0.9.1",
  };
}

async function getMahjongAnalysis(data) {
  try {
    const response = await axios.post(API_URL, data, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 2000,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        throw new Error(
          `API Error ${error.response.status}: ${error.response.data}`,
        );
      } else if (error.request) {
        // Request was made but no response received
        throw new Error("No response from mahjong analysis API");
      } else {
        // Something else happened
        throw new Error(`Request error: ${error.message}`);
      }
    }
    throw error;
  }
}

function convertResponseData(response, turn) {
  // Convert back the tile numbers to their string representations
  const options = response.response.stats.map((stat) => {
    return {
      tile: convertNumberToTile(stat.tile),
      shanten: stat.shanten,
      back: stat.shanten > response.response.shanten.all,
      wait_count: stat.necessary_tiles.reduce(
        (sum, wait) => sum + wait.count,
        0,
      ),
      wait_unique: stat.necessary_tiles.length,
      wait_types: stat.necessary_tiles.map((wait) =>
        convertNumberToTile(wait.tile),
      ),
      value: stat.exp_score[turn] || 0,
      winning: stat.win_prob[turn] || 0,
      tenpai: stat.tenpai_prob[turn] || 0,
    };
  });

  return options;
}

const cache = {};

async function analyzeWWYDSituation(i, wwyd) {
  if (cache[i]) {
    return cache[i];
  }

  const apiData = convertWwydToApiFormat(wwyd);
  const response = await getMahjongAnalysis(apiData);
  if (response.success === true) {
    const data = convertResponseData(response, parseInt(wwyd.turn));
    cache[i] = data;
    return data;
  } else {
    console.error(response.err_msg);
  }
}

const compressNotation = (tiles) => {
  const map = { m: "", p: "", s: "", z: "" };
  tiles.forEach((tile) => (map[tile[1]] += tile[0]));

  return Object.entries(map)
    .filter(([, values]) => values)
    .map(([suit, values]) => {
      if (values.length < 4) {
        return values + suit;
      }

      // Sort the numbers and find consecutive sequences
      const nums = values
        .split("")
        .map(Number)
        .sort((a, b) => a - b);
      const result = [];
      let start = 0;

      for (let i = 1; i <= nums.length; i++) {
        // End of sequence or end of array
        if (i === nums.length || nums[i] !== nums[i - 1] + 1) {
          const sequenceLength = i - start;
          if (sequenceLength >= 4) {
            result.push(`${nums[start]}-${nums[i - 1]}`);
          } else {
            result.push(nums.slice(start, i).join(""));
          }
          start = i;
        }
      }

      return result.join("") + suit;
    })
    .join("");
};

const pct = (f) => `${(f * 100).toFixed(2)}%`;
const pad = (s, n) => s.toString().padEnd(n, " ");

function formatAnalysisCompact(rows, limit = 10, hide = false) {
  rows.sort((a, b) => b.value - a.value);
  const data = [...rows].slice(0, limit);

  const head = "    Waits  Tiles              EV     Win%    Tenpai";
  const lines = [head];

  for (const r of data) {
    const tile = `${r.tile}${r.back ? "*" : " "}`;
    const waits = pad(`${r.wait_count}(${r.wait_unique})`, 6);
    const tiles = pad(compressNotation(r.wait_types).slice(0, 18), 18);
    const ev = pad(r.value.toFixed(0), 6);
    const win = pad(pct(r.winning), 7);
    const ten = pad(pct(r.tenpai), 7);

    lines.push(
      tile + " " + waits + " " + tiles + " " + ev + " " + win + " " + ten,
    );
  }

  // Wrap in code blocks (Discord field limit 1024 chars)
  const blocks = [];
  let cur = (hide ? "||" : "") + "```text\n";
  for (const ln of lines) {
    if (cur.length + ln.length + 4 > 1024) {
      cur += "```";
      blocks.push(cur);
      cur = "```text\n";
    }
    cur += ln + "\n";
  }
  cur += "```" + (hide ? "||" : "");
  blocks.push(cur);
  return blocks.join("\n");
}

module.exports = {
  convertWwydToApiFormat,
  getMahjongAnalysis,
  analyzeWWYDSituation,
  formatAnalysisCompact,
  convertResponseData
}