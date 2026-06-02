const getAnalysis = (url) => {};

const pct = (f) => `${(f * 100).toFixed(2)}%`;
const pad = (s, n) => s.toString().padStart(n, " ");

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
