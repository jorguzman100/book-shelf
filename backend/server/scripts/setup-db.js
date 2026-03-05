require("../config/load-env");
var spawnSync = require("child_process").spawnSync;

function getEnv(name, fallback) {
  var value = process.env[name];
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }

  return fallback;
}

function escapeIdentifier(identifier) {
  return "`" + String(identifier).replace(/`/g, "``") + "`";
}

function escapeSqlString(value) {
  return "'" + String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

function validateIdentifier(label, value) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(
      label + " contains unsupported characters. Use only letters, numbers, and underscore."
    );
  }
}

function buildSql(config) {
  var userAccount = escapeSqlString(config.appUser) + "@" + escapeSqlString("localhost");
  var userDefinition =
    "CREATE USER IF NOT EXISTS " +
    userAccount +
    " IDENTIFIED WITH mysql_native_password BY " +
    escapeSqlString(config.appPassword) +
    ";";
  var userAlteration =
    "ALTER USER " +
    userAccount +
    " IDENTIFIED WITH mysql_native_password BY " +
    escapeSqlString(config.appPassword) +
    ";";

  return [
    "CREATE DATABASE IF NOT EXISTS " + escapeIdentifier(config.appDatabase) + ";",
    "CREATE DATABASE IF NOT EXISTS `database_test`;",
    userDefinition,
    userAlteration,
    "GRANT ALL PRIVILEGES ON " + escapeIdentifier(config.appDatabase) + ".* TO " + userAccount + ";",
    "GRANT ALL PRIVILEGES ON `database_test`.* TO " + userAccount + ";",
    "FLUSH PRIVILEGES;"
  ].join("\n");
}

function runMysqlCli(connection, sql, databaseName) {
  var args = ["--batch", "--skip-column-names", "--raw"];

  if (connection.useTcp) {
    args.push("--protocol=TCP");
    args.push("--host", connection.host);
    args.push("--port", String(connection.port));
  }

  args.push("--user", connection.user);

  if (databaseName) {
    args.push(databaseName);
  }

  args.push("--execute", sql);

  var env = Object.assign({}, process.env);
  if (connection.password) {
    env.MYSQL_PWD = connection.password;
  } else {
    delete env.MYSQL_PWD;
  }

  var result = spawnSync("mysql", args, {
    env: env,
    encoding: "utf8"
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(
        "mysql CLI was not found in PATH. Install MySQL client tools or run setup manually."
      );
    }

    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "").trim() || "mysql CLI setup failed.");
  }

  return (result.stdout || "").trim();
}

function canConnectAsAppUser(config) {
  var appConnection = {
    useTcp: true,
    host: getEnv("DB_HOST", "127.0.0.1"),
    port: parseInt(getEnv("DB_PORT", "3306"), 10),
    user: config.appUser,
    password: config.appPassword
  };

  runMysqlCli(appConnection, "SELECT 1;", config.appDatabase);
}

function setupDatabase() {
  var config = {
    rootHost: getEnv("DB_HOST", "127.0.0.1"),
    rootPort: parseInt(getEnv("DB_PORT", "3306"), 10),
    rootUser: "root",
    rootPassword: "",
    appDatabase: getEnv("DB_NAME", "good_reader_db"),
    appUser: getEnv("DB_USER", "bookshelf_app"),
    appPassword: getEnv("DB_PASSWORD", "")
  };

  validateIdentifier("DB_NAME", config.appDatabase);
  validateIdentifier("DB_USER", config.appUser);

  if (!config.appPassword) {
    throw new Error("Missing DB_PASSWORD in .env.");
  }

  var rootTcpConnection = {
    useTcp: true,
    host: config.rootHost,
    port: config.rootPort,
    user: config.rootUser,
    password: config.rootPassword
  };
  var appTcpConnection = {
    useTcp: true,
    host: config.rootHost,
    port: config.rootPort,
    user: config.appUser,
    password: config.appPassword
  };

  var sql = buildSql(config);

  try {
    runMysqlCli(rootTcpConnection, sql);
  } catch (rootErr) {
    var socketRootConnection = {
      useTcp: false,
      user: config.rootUser,
      password: ""
    };

    try {
      runMysqlCli(socketRootConnection, sql);
      console.log("Database setup used local socket authentication for admin user.");
    } catch (socketErr) {
      try {
        runMysqlCli(appTcpConnection, sql);
        console.log("Database setup used DB_USER credentials as admin.");
      } catch (appSetupErr) {
        try {
          canConnectAsAppUser(config);
          console.warn(
            "Admin bootstrap skipped (" +
              rootErr.message +
              "). Existing app DB credentials are valid, continuing startup."
          );
          return;
        } catch (appErr) {
          throw new Error(
            rootErr.message +
              " | App admin setup failed: " +
              appSetupErr.message +
              " | App user check failed: " +
              appErr.message
          );
        }
      }
    }
  }

  console.log(
    "Database setup complete. User '" +
      config.appUser +
      "' has access to '" +
      config.appDatabase +
      "' and 'database_test'."
  );
}

try {
  setupDatabase();
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exit(1);
}
