const path = require("path");
const sharp = require("sharp");
const { Studentt } = require("distributions");

const NAGA_NAMES = ["Nishiki", "Hibakari", "Omega", "Gamma", "Kagashi"];
const WINDS = ["East", "South", "West", "North"];
const TILE_DIR = path.join(__dirname, "../assets/tiles");

// source art is 80x129; the top 12px are cropped off -> 80x117 usable
const TILE_SRC_W = 80;
const TILE_SRC_H = 129;
const TILE_CROP_TOP = 12;
const TILE_RATIO = (TILE_SRC_H - TILE_CROP_TOP) / TILE_SRC_W; // 117 / 80

const SPECIAL_MAPPINGS = {
  "5mr": "0m",
  "5pr": "0p",
  "5sr": "0s",
  E: "1z",
  S: "2z",
  W: "3z",
  N: "4z",
  P: "5z",
  F: "6z",
  C: "7z",
};

const toDefault = (t) => {
  return SPECIAL_MAPPINGS[t] ?? t;
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const tw = (s, fs) => String(s).length * fs * 0.58;

const fmtNum = (v, dp) =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

const fetchData = async (simId) => {
  const chunks = [];
  for (let i = 1; i < 20; i++) {
    const idx = String(i).padStart(5, "0");
    const resp = await fetch(
      `https://naga.dmv.nico/simulations/${simId}/result_${idx}.json`,
    );
    if (!resp.ok) break;
    chunks.push(await resp.json());
  }

  if (chunks.length === 0)
    throw new Error(`No data found for sim_id: ${simId}`);

  const counts = chunks.map((d) => d.sim_num);
  const N = counts.reduce((a, b) => a + b, 0);

  const agg = (mKey, vKey, idx = null) => {
    const ms = chunks.map((d) => (idx === null ? d[mKey] : d[mKey][idx]));
    const vs = chunks.map((d) => (idx === null ? d[vKey] : d[vKey][idx]));
    const mean = ms.reduce((acc, m, i) => acc + m * counts[i], 0) / N;
    const variance =
      vs.reduce((acc, v, i) => acc + (v + ms[i] ** 2) * counts[i], 0) / N -
      mean ** 2;
    return { mean, var: variance };
  };

  const sum = (key) => chunks.reduce((a, d) => a + d[key], 0);
  const first = chunks[0];

  return {
    simId,
    numSims: N,

    round: {
      kyoku: first.kyoku,
      honba: first.honba,
      kyotaku: first.kyotaku,
      dora: first.dora,
    },
    scores: first.scores,
    tehai: first.tehai,
    dahai: first.dahai,
    wReach: first.w_reach,
    type1: first.type1,
    type2: first.type2,

    kyokuBp: agg("mean_kyoku_bp", "var_kyoku_bp"),
    daniPts: [0, 1, 2].map((i) => agg("mean_dani_pts", "var_dani_pts", i)), // 7d/8d/9d

    rank: [0, 1, 2, 3].map((i) => chunks.reduce((a, d) => a + d.rank[i], 0)),
    endRankPred: [0, 1, 2, 3].map(
      (i) =>
        chunks.reduce((a, d, j) => a + d.end_rank_pred[i] * counts[j], 0) /
        10000,
    ),
    hora: sum("hora"),
    horaTsumo: sum("hora_tsumo"),
    horaReach: sum("hora_reach"),
    horaHuro: sum("hora_huro"),
    horaDama: sum("hora_dama"),
    hoju: sum("hoju"),
  };
};

const meanStats = ({ mean, var: v }, n) => {
  const se = Math.sqrt((v * n) / (n - 1) / n); // == sqrt(v / (n - 1))
  return {
    mean,
    se,
    n,
    moe: 1.96 * se,
    ci: [mean - 1.96 * se, mean + 1.96 * se],
  };
};

const propStats = (count, n) => {
  const c = 1.96;
  const nc = n + c * c;
  const q = (count + (c * c) / 2) / nc;
  const std = Math.sqrt((q * (1 - q)) / nc);
  return {
    mean: (count / n) * 100,
    se: std * 100,
    n,
    count,
    moe: 1.96 * std * 100,
    ci: [(q - c * std) * 100, (q + c * std) * 100],
  };
};

const welchP = (a, b) => {
  const v1 = a.se ** 2;
  const v2 = b.se ** 2;
  const seD = Math.sqrt(v1 + v2);
  if (seD === 0) return { z: 0, p: 1 };
  const t = Math.abs(a.mean - b.mean) / seD;
  const df = (v1 + v2) ** 2 / (v1 ** 2 / (a.n - 1) + v2 ** 2 / (b.n - 1));
  const p = 2 * (1 - Studentt(df).cdf(t));
  return { z: t, p };
};

const compareGroup = (items, lowerBetter = false) => {
  const sorted = [...items].sort((a, b) =>
    lowerBetter ? a.mean - b.mean : b.mean - a.mean,
  );
  const leader = sorted[0];
  for (const it of items) {
    it.rank = sorted.indexOf(it) + 1;
    if (it === leader) {
      it.z = 0;
      it.p = 1;
      it.isLeader = true;
    } else {
      const { z, p } = welchP(it, leader);
      it.z = z;
      it.p = p;
      it.isLeader = false;
    }
    // ties at p >= 0.05 are still labelled "#1"
    // it.badge = it.isLeader || it.p >= 0.05 ? "#1" : `#${it.rank}`;
    it.badge = `#${it.rank}`;
  }
};

const getAnalysis = (columns) => {
  const analysis = {
    roundEV: columns.map((c) => meanStats(c.kyokuBp, c.numSims)),
    dani7: columns.map((c) => meanStats(c.daniPts[0], c.numSims)),
    dani8: columns.map((c) => meanStats(c.daniPts[1], c.numSims)),
    dani9: columns.map((c) => meanStats(c.daniPts[2], c.numSims)),
    winPct: columns.map((c) => propStats(c.hora, c.numSims)),
  };

  // compare like-for-like: group columns by player type pair
  const groups = {};
  columns.forEach((c, i) => {
    const key = `${c.type1},${c.type2}`;
    (groups[key] ||= []).push(i);
  });

  for (const metric of Object.keys(analysis)) {
    for (const idxs of Object.values(groups)) {
      compareGroup(idxs.map((i) => analysis[metric][i]));
    }
  }

  return analysis;
};

const GREEN = [99, 190, 123];
const YELLOW = [255, 235, 132];
const RED = [248, 105, 107];

const lerp = (c1, c2, f) => c1.map((v, i) => Math.round(v + f * (c2[i] - v)));

const gyr = (z, alpha = 1) => {
  const w = z <= 0.5 ? 0 : z >= 2.5 ? 1 : (z - 0.5) / 2;
  const c =
    w <= 0.5 ? lerp(GREEN, YELLOW, w * 2) : lerp(YELLOW, RED, (w - 0.5) * 2);
  return alpha < 1 ? `rgba(${c.join(",")},${alpha})` : `rgb(${c.join(",")})`;
};

const HEADER_W = 270;
const COL_W = 335;
const LINK_BLUE = "#1a6fb8";
const TEXT = "#212529";
const GRAY = "#7f8c8d";
const CI_GRAY = "#495057";

const METRICS = {
  roundEV: { unit: "点", meanDp: 0, ciDp: 2, signed: true },
  dani7: { unit: "pt", meanDp: 2, ciDp: 2, signed: true },
  dani8: { unit: "pt", meanDp: 2, ciDp: 2, signed: true },
  dani9: { unit: "pt", meanDp: 2, ciDp: 2, signed: true },
  winPct: { unit: "%", meanDp: 1, ciDp: 1, signed: false, showCount: true },
};

const pct = (num, den, count = null) => ({
  value: `${((num / (den || 1)) * 100).toFixed(1)}%`,
  count: count === null ? num : count,
});
const pctStr = (x) => `${(x * 100).toFixed(1)}%`;
const pad = (s, n) => s.toString().padStart(n, " ");

const avgRank = (arr, den) =>
  (arr.reduce((acc, v, i) => acc + v * (i + 1), 0) / (den || 1)).toFixed(2) +
  "位";

// row table; `type` picks the cell renderer
const ROWS = [
  { label: "Round Info", h: 62, type: "roundInfo" },
  {
    label: "Points",
    h: 34,
    type: "text",
    text: (c) => c.scores.join(","),
    bold: true,
  },
  { label: "Hand", h: 50, type: "hand" },
  { label: "Discard", h: 50, type: "discard" },
  {
    label: "Player Type (Self, Opponent)",
    h: 34,
    type: "text",
    text: (c) => `${NAGA_NAMES[c.type1]}, ${NAGA_NAMES[c.type2]}`,
    bold: true,
  },
  {
    label: "Simulation Count",
    h: 34,
    type: "text",
    text: (c) => String(c.numSims),
    color: LINK_BLUE,
    bold: true,
    underline: true,
  },
  { label: "Round EV", h: 80, type: "stat", metric: "roundEV" },
  {
    label: "Average Round Rank",
    h: 34,
    type: "text",
    text: (c) => avgRank(c.rank, c.numSims),
  },
  {
    label: "Round 1st %",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.rank[0], c.numSims),
  },
  {
    label: "Round 2nd %",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.rank[1], c.numSims),
  },
  {
    label: "Round 3rd %",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.rank[2], c.numSims),
  },
  {
    label: "Round 4th %",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.rank[3], c.numSims),
  },
  {
    label: "Expected Hanchan Rank",
    h: 34,
    type: "text",
    text: (c) => avgRank(c.endRankPred, c.numSims),
  },
  {
    label: "Expected Hanchan 1st %",
    h: 34,
    type: "text",
    text: (c) => pct(c.endRankPred[0], c.numSims).value,
  },
  {
    label: "Expected Hanchan 2nd %",
    h: 34,
    type: "text",
    text: (c) => pct(c.endRankPred[1], c.numSims).value,
  },
  {
    label: "Expected Hanchan 3rd %",
    h: 34,
    type: "text",
    text: (c) => pct(c.endRankPred[2], c.numSims).value,
  },
  {
    label: "Expected Hanchan 4th %",
    h: 34,
    type: "text",
    text: (c) => pct(c.endRankPred[3], c.numSims).value,
  },
  { label: "Tenhou 7d pt. EV", h: 80, type: "stat", metric: "dani7" },
  { label: "Tenhou 8d pt. EV", h: 80, type: "stat", metric: "dani8" },
  { label: "Tenhou 9d pt. EV", h: 80, type: "stat", metric: "dani9" },
  { label: "Win %", h: 80, type: "stat", metric: "winPct" },
  {
    label: "% of Wins from Riichi",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.horaReach, c.hora),
  },
  {
    label: "% of Wins from Open",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.horaHuro, c.hora),
  },
  {
    label: "% of Wins from Dama",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.horaDama, c.hora),
  },
  {
    label: "% of Wins from Tsumo",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.horaTsumo, c.hora),
  },
  {
    label: "% of Wins from Ron",
    h: 34,
    type: "pctCount",
    get: (c) => pct(c.hora - c.horaTsumo, c.hora),
  },
];

const tileCache = new Map();
const loadTile = async (name, w) => {
  const h = Math.round(w * TILE_RATIO);
  const key = `${name}:${w}`;
  if (!tileCache.has(key)) {
    const file = path.join(TILE_DIR, `${toDefault(name)}.png`);
    tileCache.set(
      key,
      await sharp(file)
        .extract({
          left: 0,
          top: TILE_CROP_TOP,
          width: TILE_SRC_W,
          height: TILE_SRC_H - TILE_CROP_TOP,
        })
        .resize(w, h)
        .png()
        .toBuffer(),
    );
  }
  return tileCache.get(key);
};

const renderColumn = (col, analysis, colIndex, x, rowYs) => {
  const svg = [];
  const tiles = [];
  const cx = x + COL_W / 2;

  ROWS.forEach((row, ri) => {
    const y = rowYs[ri];
    const h = row.h;
    const midY = y + h / 2;

    if (row.type === "roundInfo") {
      const wind = WINDS[Math.trunc(col.round.kyoku / 4)];
      const line1 = `${wind} ${(col.round.kyoku % 4) + 1}-${col.round.honba} (Deposit:${col.round.kyotaku})`;
      svg.push(
        `<text x="${cx}" y="${y + 22}" text-anchor="middle" font-size="13" font-weight="bold" fill="${TEXT}">${esc(line1)}</text>`,
      );
      const label = "Dora Indicator:";
      const tileW = 16;
      const tileH = Math.round(tileW * TILE_RATIO);
      const total = tw(label, 13) + 6 + tileW;
      svg.push(
        `<text x="${cx - total / 2}" y="${y + 45}" font-size="13" font-weight="bold" fill="${TEXT}">${esc(label)}</text>`,
      );
      tiles.push({
        name: col.round.dora,
        w: tileW,
        left: Math.round(cx - total / 2 + tw(label, 13) + 6),
        top: Math.round(y + 45 - tileH + 4),
      });
    } else if (row.type === "hand") {
      const tileW = 21;
      const tileH = Math.round(tileW * TILE_RATIO);
      const startX = cx - (col.tehai.length * tileW) / 2;
      col.tehai.forEach((t, i) => {
        tiles.push({
          name: t,
          w: tileW,
          left: Math.round(startX + i * tileW),
          top: Math.round(midY - tileH / 2),
        });
      });
    } else if (row.type === "discard") {
      const tileW = 21;
      const tileH = Math.round(tileW * TILE_RATIO);
      const extra = col.wReach ? tw(" (Riichi)", 12) : 0;
      tiles.push({
        name: col.dahai,
        w: tileW,
        left: Math.round(cx - (tileW + extra) / 2),
        top: Math.round(midY - tileH / 2),
      });
      if (col.wReach) {
        svg.push(
          `<text x="${cx - (tileW + extra) / 2 + tileW + 4}" y="${midY + 4}" font-size="12" fill="${TEXT}">(Riichi)</text>`,
        );
      }
    } else if (row.type === "text") {
      const deco = row.underline ? ` text-decoration="underline"` : "";
      svg.push(
        `<text x="${cx}" y="${midY + 4.5}" text-anchor="middle" font-size="13"${row.bold ? ' font-weight="bold"' : ""} fill="${row.color || TEXT}"${deco}>${esc(row.text(col))}</text>`,
      );
    } else if (row.type === "pctCount") {
      const { value, count } = row.get(col);
      const countStr = `(${count})`;
      const total = tw(value, 13) + 5 + tw(countStr, 13);
      const startX = cx - total / 2;
      svg.push(
        `<text x="${startX}" y="${midY + 4.5}" font-size="13" fill="${TEXT}">${esc(value)}</text>`,
        `<text x="${startX + tw(value, 13) + 5}" y="${midY + 4.5}" font-size="13" fill="${LINK_BLUE}" text-decoration="underline">${esc(countStr)}</text>`,
      );
    } else if (row.type === "stat") {
      const st = analysis[row.metric][colIndex];
      const cfg = METRICS[row.metric];

      // cell tint
      svg.push(
        `<rect x="${x}" y="${y}" width="${COL_W}" height="${h}" fill="${gyr(st.z, 0.14)}"/>`,
      );

      // badge line
      const pText = st.isLeader
        ? ""
        : st.p < 0.001
          ? "(p < 0.001)"
          : `(p = ${st.p.toFixed(3)})`;
      const badgeW = tw(st.badge, 10) + 14;
      const lineW = badgeW + (pText ? 6 + tw(pText, 10) : 0);
      const bx = cx - lineW / 2;
      const by = y + 10;
      svg.push(
        `<rect x="${bx}" y="${by}" width="${badgeW}" height="15" rx="7.5" fill="${gyr(st.z)}"/>`,
        `<text x="${bx + badgeW / 2}" y="${by + 11}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">${esc(st.badge)}</text>`,
      );
      if (pText) {
        svg.push(
          `<text x="${bx + badgeW + 6}" y="${by + 11.5}" font-size="10" fill="${GRAY}">${esc(pText)}</text>`,
        );
      }

      // mean line
      let meanStr = fmtNum(st.mean, cfg.meanDp);
      if (cfg.signed && st.mean >= 0) meanStr = "+" + meanStr;
      let line = `${meanStr} (±${st.moe.toFixed(cfg.meanDp)})${cfg.unit}`;
      const countStr = cfg.showCount ? `(${st.count})` : "";
      const gap = countStr ? 5 : 0;
      const meanY = y + 44;
      const lineTotal =
        tw(line, 14) + gap + (countStr ? tw(countStr, 12.5) : 0);
      const mx = cx - lineTotal / 2;
      svg.push(
        `<text x="${mx}" y="${meanY}" font-size="14" font-weight="bold" fill="${TEXT}">${esc(line)}</text>`,
      );
      if (countStr) {
        svg.push(
          `<text x="${mx + tw(line, 14) + gap}" y="${meanY}" font-size="12.5" fill="${LINK_BLUE}" text-decoration="underline">${esc(countStr)}</text>`,
        );
      }

      // 95% CI
      svg.push(
        `<text x="${cx}" y="${y + 64}" text-anchor="middle" font-size="10.5" fill="${CI_GRAY}">95% CI: [${st.ci[0].toFixed(cfg.ciDp)}, ${st.ci[1].toFixed(cfg.ciDp)}]</text>`,
      );
    }
  });

  return { svg, tiles };
};

const renderImage = async (columns, analysis) => {
  const width = HEADER_W + COL_W * columns.length;
  const rowYs = [];
  let yAcc = 0;
  for (const r of ROWS) {
    rowYs.push(yAcc);
    yAcc += r.h;
  }
  const height = yAcc;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Noto Sans JP, monospace">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
  ];

  // zebra striping + row separators
  ROWS.forEach((row, ri) => {
    const y = rowYs[ri];
    if (ri % 2 === 1) {
      svg.push(
        `<rect x="0" y="${y}" width="${width}" height="${row.h}" fill="#f5f5f5"/>`,
      );
    }
    svg.push(
      `<line x1="0" y1="${y + row.h}" x2="${width}" y2="${y + row.h}" stroke="#dddddd" stroke-width="1"/>`,
    );
  });

  // header labels
  ROWS.forEach((row, ri) => {
    svg.push(
      `<text x="${HEADER_W / 2}" y="${rowYs[ri] + row.h / 2 + 4.5}" text-anchor="middle" font-size="13" font-weight="bold" fill="${TEXT}">${esc(row.label)}</text>`,
    );
  });

  // vertical divider between header column and data
  svg.push(
    `<line x1="${HEADER_W}" y1="0" x2="${HEADER_W}" y2="${height}" stroke="#333333" stroke-width="1.5"/>`,
  );

  // data columns
  const allTiles = [];
  columns.forEach((col, i) => {
    const x = HEADER_W + i * COL_W;
    const { svg: colSvg, tiles } = renderColumn(col, analysis, i, x, rowYs);
    svg.push(...colSvg);
    allTiles.push(...tiles);
  });

  // faint separators between data columns
  for (let i = 1; i < columns.length; i++) {
    const sx = HEADER_W + i * COL_W;
    svg.push(
      `<line x1="${sx}" y1="0" x2="${sx}" y2="${height}" stroke="#e0e0e0" stroke-width="1"/>`,
    );
  }

  svg.push("</svg>");

  // rasterise the svg, then composite tile images on top
  const composites = await Promise.all(
    allTiles.map(async (t) => ({
      input: await loadTile(t.name, t.w),
      left: t.left,
      top: t.top,
    })),
  );

  const base = sharp(Buffer.from(svg.join("\n"))).png();
  const rendered = await base.toBuffer();
  const out = sharp(rendered).composite(composites);

  return await out.png().toBuffer();
};

const renderFromUrl = async (url) => {
  const parsed = new URL(url);
  const simIds = parsed.searchParams
    .get("sim_ids")
    .split(",")
    .map((d) => d.split("_")[0]);

  const columns = await Promise.all(simIds.map(fetchData));
  const analysis = getAnalysis(columns);
  return renderImage(columns, analysis);
};

const formatAnalysisCompact = (data, hide = false) => {
  const lines = [];

  lines.push("       EV    SE          95% CI   Win %  Sims");

  for (let tileData of data.data) {
    const tile = tileData.tile;
    const ev = tileData.mean.toFixed(0);

    const std_num = Math.sqrt(tileData.var / tileData.num_sims);

    const std = std_num.toFixed(0);
    const lowerCI = (tileData.mean - 1.96 * std_num).toFixed(0);
    const upperCI = (tileData.mean + 1.96 * std_num).toFixed(0);

    const win = pctStr(tileData.win);

    lines.push(
      tile +
        "  " +
        pad(ev, 5) +
        "  " +
        pad(std, 4) +
        "  " +
        pad(`(${lowerCI},${upperCI})`, 14) +
        "  " +
        pad(win, 6) +
        "  " +
        pad(tileData.num_sims, 4),
    );
  }

  if (data.t_test) {
    lines.push("");
    lines.push("Welch's 2 Sample T-Test");
    lines.push(`H_α: EV ${data.t_test.tiles[0]} ≠ ${data.t_test.tiles[1]}`);
    lines.push(
      `t=${data.t_test.t.toFixed(2)}, df=${data.t_test.df.toFixed(2)}`,
    );
    lines.push(`p=${data.t_test.p.toFixed(4)}`);
  }

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
};

module.exports = {
  fetchData,
  getAnalysis,
  renderColumn,
  renderImage,
  renderFromUrl,
  formatAnalysisCompact,
};
