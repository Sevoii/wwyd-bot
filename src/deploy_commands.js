require("dotenv").config({ path: "./.env" });

const { REST, Routes } = require("discord.js");
const { load_commands } = require("./commands/load_commands");

const commands = load_commands().map(x => x.data.toJSON());
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();