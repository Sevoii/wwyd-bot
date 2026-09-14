require("dotenv").config({ path: "./.env" });

const { Client, Events, GatewayIntentBits } = require("discord.js");
const Database = require("./db");
const {
  generateQuestionMessage,
  getWwydUUID,
} = require("./wwyd/wwyd_discord");
const { getWwyd } = require("./wwyd/wwyd_gen");

const getDailyButtonUuid = (message) => {
  for (const row of message.components) {
    for (const component of row.components) {
      const [label, , uuid] = component.customId?.split(":") ?? [];
      if (label === "wwyd_daily") return uuid;
    }
  }

  return null;
};

const getAffectedWwyds = async (db) => {
  return await db.connection.all(
    `SELECT WwydDaily.*, WwydChannels.dailyping
     FROM WwydDaily
              LEFT JOIN WwydChannels ON WwydChannels.guild_id = WwydDaily.guild_id
     WHERE WwydDaily.created >= datetime('now', '-30 minutes')
       AND NOT EXISTS (SELECT 1
                       FROM WwydScore
                       WHERE WwydScore.guild_id = WwydDaily.guild_id
                         AND WwydScore.problem_id = WwydDaily.problem_id)
     ORDER BY WwydDaily.created ASC`,
  );
};

const replaceDatabaseRow = async (db, row, uuid, message) => {
  await db.connection.run("BEGIN TRANSACTION;");

  try {
    await db.connection.run(
      `UPDATE WwydDaily
       SET problem_id = @uuid,
           channel_id = @channelId,
           message_id = @messageId,
           created = CURRENT_TIMESTAMP
       WHERE guild_id = @guildId
         AND problem_id = @oldProblemId`,
      {
        uuid,
        channelId: message.channelId,
        messageId: message.id,
        guildId: row.guild_id,
        oldProblemId: row.problem_id,
      },
    );
    await db.connection.run("COMMIT;");
  } catch (err) {
    await db.connection.run("ROLLBACK;");
    throw err;
  }
};

const repairWwyd = async (client, db, row) => {
  const channel = await client.channels.fetch(row.channel_id);
  if (!channel?.isTextBased()) {
    throw new Error(`Channel ${row.channel_id} is not text-based`);
  }

  const oldMessage = await channel.messages.fetch(row.message_id);
  const buttonUuid = getDailyButtonUuid(oldMessage);

  if (buttonUuid == null) {
    console.log(`Skipping ${row.message_id}: no daily WWYD button found`);
    return;
  }

  if (buttonUuid === row.problem_id) {
    console.log(`Skipping ${row.message_id}: UUID already matches`);
    return;
  }

  const wwyd = getWwyd(row.internal_id);
  const uuid = getWwydUUID(wwyd);
  const replacement = await channel.send(
    await generateQuestionMessage(
      wwyd,
      uuid,
      "wwyd_daily",
      false,
      row.dailyping ?? null,
    ),
  );

  await replaceDatabaseRow(db, row, uuid, replacement);

  try {
    await oldMessage.delete();
    console.log(
      `Reposted and replaced ${row.message_id} with ${replacement.id}`,
    );
  } catch (err) {
    console.error(
      `Reposted ${row.message_id} as ${replacement.id}, but could not delete the old message`,
      err,
    );
  }
};

const main = async () => {
  const db = new Database({
    connection_type: "local_sqlite3",
    run_migrations: true,
    file: "wwyd.db",
  });
  await db.initialize();

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await new Promise((resolve, reject) => {
      client.once(Events.ClientReady, async () => {
        try {
          const rows = await getAffectedWwyds(db);
          console.log(`Found ${rows.length} recent WWYD row(s) to check`);

          for (const row of rows) {
            try {
              await repairWwyd(client, db, row);
            } catch (err) {
              console.error(`Failed to repair ${row.message_id}`, err);
            }
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      client.login(process.env.DISCORD_BOT_TOKEN).catch(reject);
    });
  } finally {
    client.destroy();
  }
};

main().catch((err) => {
  console.error("WWYD repair failed", err);
  process.exitCode = 1;
});
