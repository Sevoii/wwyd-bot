require("dotenv").config({ path: "./.env" });
const { Client, Events, GatewayIntentBits, MessageFlags } = require("discord.js");
const { loadCommands } = require("./commands/load_commands");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.commands = loadCommands();

client.on(Events.InteractionCreate, (interaction) => {
  // console.log(interaction);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral
      });
    }
  }
});


client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);
