const { Events } = require("discord.js");
const schedule = require("node-schedule");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    const rule = new schedule.RecurrenceRule();
    rule.hour = 15;
    rule.minute = 0;
    // rule.tz = "Etc/UTC";

    schedule.scheduleJob(rule, () => {
      client.emit("WWYD_Daily", client);
    });
  },
};
