require("dotenv").config({ path: "./.env" });
const { Client, GatewayIntentBits } = require("discord.js");
const { loadCommands } = require("./commands/load_commands");
const { loadEvents } = require("./events/load_events");
const Database = require("./db");

// Install Fonts onto Linux System
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

if (process.platform === "linux") {
  console.log("Detected platform as linux, trying to install fonts");

  const fontSrc = path.resolve("assets/fonts/JetBrainsMono-ExtraBold.ttf");
  const fontDir = path.join(os.homedir(), ".local/share/fonts");
  const fontDest = path.join(fontDir, "JetBrainsMono-ExtraBold.ttf");

  if (!fs.existsSync(fontDest)) {
    console.log("Installing fonts");
    fs.mkdirSync(fontDir, { recursive: true });
    fs.copyFileSync(fontSrc, fontDest);
    execSync("fc-cache -f");
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

(async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      ...(process.env.USES_PRIVILEGED === "true"
        ? [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
        : []),
    ],
  });
  const db = new Database({
    connection_type: "local_sqlite3",
    run_migrations: true,
    file: "wwyd.db",
  });

  await db.initialize();

  client.commands = loadCommands();
  client.db = db;

  loadEvents(client);

  client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);
})();
