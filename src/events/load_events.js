const fs = require("node:fs");
const path = require("node:path");

const loadEvents = (client) => {
  for (const path_name of fs.readdirSync(__dirname)) {
    if (path_name === "load_events.js") continue;

    const new_path = path.join(__dirname, path_name);
    const stats = fs.statSync(new_path);

    if (
      stats.isFile() &&
      (path_name.endsWith(".js") || path_name.endsWith(".ts"))
    ) {
      const event = require(new_path);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    } else if (stats.isDirectory()) {
      for (const file of fs.readdirSync(new_path)) {
        const filePath = path.join(new_path, file);
        const event = require(filePath);
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
      }
    } else {
      console.log(`[WARNING] Ignoring ${new_path}`);
    }
  }
};

module.exports = {
  loadEvents,
};
