const Database = require("./db");

(async () => {
  const db = new Database({
    connection_type: "local_sqlite3",
    run_migrations: true,
    file: "wwyd.db",
  });

  await db.connect();
  await db.migrate();
})();
