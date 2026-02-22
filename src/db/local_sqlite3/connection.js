const sqlite3 = require("better-sqlite3");
const fs = require("fs");

module.exports = class SqliteConnection {
  constructor(config) {
    if (!config.file) {
      throw Error("Sqlite3 file was not provided");
    }

    const db = sqlite3(config.file);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    this.db = db;
  }

  async get(query, params = {}) {
    return this.db.prepare(query).get(params);
  }

  async all(query, params = {}) {
    return this.db.prepare(query).all(params);
  }

  async run(query, params = {}) {
    this.db.prepare(query).run(params);
  }

  async backup(backup_dir = null) {
    if (!fs.existsSync("backups")) {
      fs.mkdirSync("backups");
    }

    try {
      await this.db.backup(
        `${backup_dir ?? "backups"}/backup-${Date.now()}.db`,
      );
      console.log("Backup complete");
    } catch (err) {
      console.error("Backup failed:", err);
    }
  }

  async close() {}
};
