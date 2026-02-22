const fs = require("fs").promises;
const path = require("path");

class MigrationManager {
  constructor(connection) {
    this.connection = connection;
  }

  async initialize() {
    this.connection.run(`
      CREATE TABLE IF NOT EXISTS SchemaMigration
      (
        version INTEGER PRIMARY KEY,
        name    TEXT NOT NULL
      );
    `);
  }

  async getMigrationFiles() {
    const files = await fs.readdir(__dirname);

    return files
      .filter((f) => f.match(/^\d+_.*\.js$/))
      .map((f) => {
        const version = parseInt(f.split("_")[0]);
        const name = f.replace(".js", "");
        return {
          version,
          name,
          path: path.join(__dirname, f),
          upgrade: require(path.join(__dirname, f)).upgrade,
        };
      });
  }

  async getLatestMigration() {
    const result = await this.connection.get(
      "SELECT MAX(version) AS version FROM SchemaMigration",
    );
    return result.version;
  }

  async runMigration(migration) {
    try {
      await this.connection.run("BEGIN TRANSACTION;");
      await migration.upgrade(this.connection);
      await this.connection.run(
        "INSERT INTO SchemaMigration (version, name) VALUES (@version, @name)",
        { version: migration.version, name: migration.name },
      );
      await this.connection.run("COMMIT;");
      console.log(`Migration ${migration.version} completed`);
    } catch (err) {
      await this.connection.run("ROLLBACK;");
      console.log(`Migration ${migration.version} failed`);
      throw err;
    }
  }

  async migrate(targetVersion = null) {
    await this.initialize();

    const applied = await this.getLatestMigration();
    const migrationFiles = await this.getMigrationFiles();

    const pending = migrationFiles.filter((file) => file.version > applied);
    pending.sort((a, b) => a.version - b.version);

    const toRun = targetVersion
      ? pending.filter((m) => m.version <= targetVersion)
      : pending;

    console.log(`Running ${toRun.length} pending migrations...`);

    for (const migration of toRun) {
      await this.runMigration(migration);
    }
  }
}

module.exports = MigrationManager;
