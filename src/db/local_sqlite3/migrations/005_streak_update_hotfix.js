module.exports = {
  upgrade: async (connection) => {
    await connection.run(`UPDATE UserScore
                          SET streak = (SELECT COUNT(*)
                                        FROM WwydScore ws
                                        WHERE ws.guild_id = UserScore.guild_id
                                          AND ws.discord_id = UserScore.discord_id
                                          AND ws.problem_id > (SELECT COALESCE(MAX(wss.problem_id), "")
                                                               FROM WwydScore wss
                                                               WHERE wss.correct = 0
                                                                 AND wss.guild_id = UserScore.guild_id
                                                                 AND wss.discord_id = UserScore.discord_id));
    `);

    await connection.run("UPDATE UserScore SET best_streak = streak");
  },
};
