const wwyd = require("./assets/wwyd.json");
const {
  convertWwydToApiFormat,
  convertResponseData,
} = require("./wwyd/wwyd_pystyle");
const fs = require("fs");
const axios = require("axios");
// const { SocksProxyAgent } = require("socks-proxy-agent");
// const proxies = require("./assets/socks_proxies.json").map((x) => {
//   [host, port, username, password] = x.split(":");
//   return new SocksProxyAgent(
//     `socks5://${username}:${password}@${host}:${port}`,
//   );
// });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const API_URL = "https://pystyle.info/apps/mahjong-cpp_0.9.1/post.py";
// const API_URL = "http://localhost:8002/";

const formatJson = (arr) => {
  return (
    "[\n" + arr.map((obj) => "  " + JSON.stringify(obj)).join(",\n") + "\n]"
  );
};

(async () => {
  let c = 0;
  for (let i of wwyd) {
    // Skip empty wwyds
    // if (!i.pystyle.length) continue;

    if (++c % 10 === 0) {
      console.log(`Parsing ${c}'th wwyd`);
      fs.writeFileSync("./assets/wwyd.json", formatJson(wwyd), "utf8");
    }

    const data = convertWwydToApiFormat(i);

    let tries = 0;
    let resp;
    while (!resp) {
      // const agent = proxies[Math.floor(Math.random() * proxies.length)];

      try {
        const request = await axios.post(API_URL, data, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
          // httpsAgent: agent,
        });

        resp = request.data;
      } catch (e) {
        // Assume ratelimiting
        if (tries++ < 3) {
          await sleep(5000);
        } else {
          console.error(e);
          resp = [];
          break;
        }
      }
    }

    i.pystyle = resp.length ? convertResponseData(resp, parseInt(i.turn)) : resp;
    await sleep(500);
  }

  // fs.writeFileSync("./assets/wwyd.json", JSON.stringify(wwyd, null, 2), "utf8");
  fs.writeFileSync("./assets/wwyd.json", formatJson(wwyd), "utf8");
})().catch(console.error);
