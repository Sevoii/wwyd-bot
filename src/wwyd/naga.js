const { Studentt } = require("distributions");

const pct = (f) => `${(f * 100).toFixed(2)}%`;
const pad = (s, n) => s.toString().padStart(n, " ");

const fetchData = async (simId) => {
  const data = [];

  for (let i = 1; i < 20; i++) {
    const idx = String(i).padStart(5, "0");
    const resp = await fetch(
      `https://naga.dmv.nico/simulations/${simId}/result_${idx}.json`,
    );
    if (!resp.ok) break;
    data.push(await resp.json());
  }

  if (data.length === 0) {
    throw new Error(`No data found for sim_id: ${simId}`);
  }

  const tileDiscard = data[0]["dahai"];
  const riichi = data[0]["w_reach"];

  const counts = data.map((d) => d["sim_num"]);
  const means = data.map((d) => d["mean_kyoku_bp"]);
  const variance = data.map((d) => d["var_kyoku_bp"]);
  const wins = data.map((d) => d["hora"]);

  const totalCount = counts.reduce((a, b) => a + b, 0);
  const winsPercentage = wins.reduce((a, b) => a + b, 0) / totalCount;

  const meansAgg =
    means.reduce((acc, m, i) => acc + m * counts[i], 0) / totalCount;

  const varAggN =
    variance.reduce((acc, v, i) => acc + (v + means[i] ** 2) * counts[i], 0) /
      totalCount -
    meansAgg ** 2;

  return {
    tile: tileDiscard + (riichi ? "(r)" : ""),
    mean: meansAgg,
    var: varAggN,
    win: winsPercentage,
    num_sims: totalCount,
  };
};

const getAnalysis = async (url) => {
  const parsed = new URL(url);
  const simIds = parsed.searchParams.get("sim_ids").split(",");

  let simData;
  try {
    simData = await Promise.all(simIds.map(fetchData));
  } catch (err) {
    return null;
  }
  simData.sort((a, b) => b.mean - a.mean);

  const nagaData = { data: simData, url };

  if (simData.length >= 2) {
    const n1 = simData[0].num_sims;
    const n2 = simData[1].num_sims;

    // bessel correction
    const v1 = simData[0].var / (n1 - 1);
    const v2 = simData[1].var / (n2 - 1);

    const t = (simData[0].mean - simData[1].mean) / Math.sqrt(v1 + v2);

    // welch df
    const df = (v1 + v2) ** 2 / (v1 ** 2 / (n1 - 1) + v2 ** 2 / (n2 - 1));

    const pValue = 2 * (1 - Studentt(df).cdf(Math.abs(t)));

    nagaData.t_test = {
      tiles: [simData[0].tile, simData[1].tile],
      t,
      df,
      p: pValue,
    };
  }

  return nagaData;
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

    const win = pct(tileData.win);

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

  lines.push("");
  lines.push("Welch's 2 Sample T-Test");
  lines.push(`Compare: ${data.t_test.tiles[0]}, ${data.t_test.tiles[1]}`);
  lines.push(`t=${data.t_test.t.toFixed(2)}, df=${data.t_test.df.toFixed(2)}`);
  lines.push(`p=${data.t_test.p.toFixed(4)}`);

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
  getAnalysis,
  formatAnalysisCompact,
};
