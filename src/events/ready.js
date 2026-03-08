const { Events, ActivityType } = require("discord.js");
const schedule = require("node-schedule");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.user.setActivity("Invite me to your server!", {
      type: ActivityType.Custom,
    });

    const rule = new schedule.RecurrenceRule();
    rule.hour = 10;
    rule.minute = 0;
    rule.tz = "America/New_York";

    schedule.scheduleJob(rule, () => {
      client.emit("WWYD_Daily", client);
      client.db.backup()
    });
  },
};
