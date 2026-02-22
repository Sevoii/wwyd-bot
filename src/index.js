require("dotenv").config({ path: "./.env" });
const { Client, GatewayIntentBits } = require("discord.js");
const { loadCommands } = require("./commands/load_commands");
const { loadEvents } = require("./events/load_events");
const Database = require("./db");

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
