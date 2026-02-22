const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  once: false,
  execute: async (message) => {
    let content = message.content;
    if (!content.startsWith(`<@${process.env.CLIENT_ID}> `)) {
      return;
    } else if (message.author.id !== "912708332916195368") {
      await message.reply("You are not authorized to use this command");
      return;
    }

    let args = content.split(" ");
    args.shift();
    let command = args.shift();

    if (command === "force") {
      await message.reply("OK");
      message.client.emit("WWYD_Daily", message.client, message.channel);
    } else if (command === "toggle") {
      const res = await message.client.db.models.daily_toggle.toggleDaily(
        message.guildId,
        message.channelId,
      );
      if (res === 1) {
        await message.reply(
          `Successfully enabled WWYD in <#${message.channelId}>`,
        );
      } else if (res === 0) {
        await message.reply(
          `Successfully disabled WWYD in <#${message.channelId}>`,
        );
      } else {
        await message.reply("Internal Error, please try again");
      }
    }
  },
};
