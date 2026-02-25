const fs = require("fs");
const path = require("path");
const databases = require("./databases");

class Database {
  constructor(
    config = {
      connection_type: "local_sqlite3",
      run_migrations: false,
    },
  ) {
    this.config = config;
    this.config.connection_type =
      this.config.connection_type ?? "local_sqlite3";

    this.connection = null;
    this.models = {};
  }

  async initialize() {
    await this.connect();

    if (this.config.run_migrations) {
      await this.migrate();
    }

    await this.loadModels();
  }

  async migrate() {
    if (databases[this.config.connection_type].Connection) {
      const migrator = new databases[this.config.connection_type].Migration(
        this.connection,
      );
      await migrator.migrate();
    } else {
      throw Error(
        `Database connection type ${this.config.connection_type} has no migrations specified`,
      );
    }
  }

  async loadModels() {
    const modelsPath = path.join(__dirname, "models");

    const modelFiles = fs
      .readdirSync(modelsPath)
      .filter(
        (file) =>
          file.endsWith(".js") &&
          file !== "index.js" &&
          !file.startsWith("base") &&
          !file.startsWith("_"),
      );

    modelFiles.forEach((file) => {
      const modelName = path.basename(file, ".js");

      try {
        const ModelClass = require(path.join(modelsPath, file));
        this.models[modelName] = new ModelClass(this.connection);

        console.log(`Loaded model: ${modelName}`);
      } catch (error) {
        console.error(`Failed to load model ${modelName}:`, error.message);
      }
    });
  }

  async connect() {
    if (!(this.config.connection_type in databases)) {
      throw Error(
        `Database connection type ${this.config.connection_type} not a valid connection type`,
      );
    }

    this.connection = new databases[this.config.connection_type].Connection(
      this.config,
    );

    return this;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      console.log("Database disconnected");
    }
  }

  getModel(name) {
    return this.models[name];
  }

  backup(backup_dir = null) {
    if ("backup" in this.connection) {
      this.connection.backup(backup_dir).catch(console.error);
    }
  }
}

module.exports = Database;
