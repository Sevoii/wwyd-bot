const { Events, ActivityType } = require("discord.js");
const { DateTime } = require("luxon");
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
      client.db.backup();
    });

    const now = DateTime.now().setZone("America/New_York");
    const scheduledSendTime = now.set({
      hour: 10,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    if (Math.abs(now.diff(scheduledSendTime, "hours").hours) > 1) {
      client.emit("WWYD_Daily", client);
    } else {
      console.log("Skipping startup WWYD send");
    }

    client.db.backup();
  },
};
