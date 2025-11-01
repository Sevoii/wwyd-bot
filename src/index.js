require("dotenv").config({ path: "./.env" });
const {
  Client,
  GatewayIntentBits,
} = require("discord.js");
const { loadCommands } = require("./commands/load_commands");
const { loadEvents } = require("./events/load_events");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = loadCommands();
loadEvents(client);

client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);
