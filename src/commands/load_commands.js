const fs = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");


const load_commands = () => {
  const commands = new Collection();

  for (const path_name of fs.readdirSync(__dirname)) {
    if (path_name === "load_commands.js") continue;

    const new_path = path.join(__dirname, path_name);
    const stats = fs.statSync(new_path);

    if (stats.isFile() && (path_name.endsWith(".js") || path_name.endsWith(".ts"))) {
      const command = require(new_path);
      if ("data" in command && "execute" in command) {
        commands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] The command at ${new_path} is missing a required "data" or "execute" property.`);
      }
    } else if (stats.isDirectory()) {
      for (const file of fs.readdirSync(new_path)) {
        const filePath = path.join(new_path, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
          commands.set(command.data.name, command);
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    } else {
      console.log(`[WARNING] Ignoring ${new_path}`);
    }
  }

  return commands;
};

module.exports = {
  load_commands
};