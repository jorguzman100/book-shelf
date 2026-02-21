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

function validateAccountPart(label, value) {
  if (!/^[A-Za-z0-9_.%-]+$/.test(value)) {
    throw new Error(
      label + " contains unsupported characters. Use only letters, numbers, dot, underscore, percent, and dash."
    );
  }
}

function buildSql(config) {
  var userAccount = escapeSqlString(config.appUser) + "@" + escapeSqlString(config.appUserHost);

  var userDefinition;
  var userAlteration;

  if (config.authPlugin === "default") {
    userDefinition =
      "CREATE USER IF NOT EXISTS " +
      userAccount +
      " IDENTIFIED BY " +
      escapeSqlString(config.appPassword) +
      ";";
    userAlteration =
      "ALTER USER " +
      userAccount +
      " IDENTIFIED BY " +
      escapeSqlString(config.appPassword) +
      ";";
  } else {
    userDefinition =
      "CREATE USER IF NOT EXISTS " +
      userAccount +
      " IDENTIFIED WITH " +
      config.authPlugin +
      " BY " +
      escapeSqlString(config.appPassword) +
      ";";
    userAlteration =
      "ALTER USER " +
      userAccount +
      " IDENTIFIED WITH " +
      config.authPlugin +
      " BY " +
      escapeSqlString(config.appPassword) +
      ";";
  }

  var sqlStatements = [];

  if (config.resetOnSetup) {
    sqlStatements.push("DROP DATABASE IF EXISTS " + escapeIdentifier(config.appDatabase) + ";");
    sqlStatements.push("DROP DATABASE IF EXISTS " + escapeIdentifier(config.testDatabase) + ";");
    sqlStatements.push("DROP USER IF EXISTS " + userAccount + ";");
  }

  sqlStatements.push("CREATE DATABASE IF NOT EXISTS " + escapeIdentifier(config.appDatabase) + ";");
  sqlStatements.push("CREATE DATABASE IF NOT EXISTS " + escapeIdentifier(config.testDatabase) + ";");
  sqlStatements.push(userDefinition);
  sqlStatements.push(userAlteration);
  sqlStatements.push(
    "GRANT ALL PRIVILEGES ON " + escapeIdentifier(config.appDatabase) + ".* TO " + userAccount + ";"
  );
  sqlStatements.push(
    "GRANT ALL PRIVILEGES ON " + escapeIdentifier(config.testDatabase) + ".* TO " + userAccount + ";"
  );
  sqlStatements.push("FLUSH PRIVILEGES;");

  return sqlStatements.join("\n");
}

function runMysqlCli(connection, sql, databaseName) {
  var args = [
    "--batch",
    "--skip-column-names",
    "--raw"
  ];

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

function checkMysqlConnection(connection) {
  var query = "SELECT VERSION()";
  var version = runMysqlCli(connection, query + ";");

  if (version) {
    console.log("MySQL connection OK. Server version:", version);
  } else {
    console.log("MySQL connection OK.");
  }
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
    rootHost: getEnv(
      "MYSQL_ADMIN_HOST",
      getEnv("MYSQL_ROOT_HOST", getEnv("DB_HOST", "127.0.0.1"))
    ),
    rootPort: parseInt(
      getEnv("MYSQL_ADMIN_PORT", getEnv("MYSQL_ROOT_PORT", getEnv("DB_PORT", "3306"))),
      10
    ),
    rootUser: getEnv("MYSQL_ADMIN_USER", getEnv("MYSQL_ROOT_USER", "root")),
    rootPassword: getEnv("MYSQL_ADMIN_PASSWORD", getEnv("MYSQL_ROOT_PASSWORD", "")),
    appDatabase: getEnv("DB_NAME", "good_reader_db"),
    testDatabase: getEnv("TEST_DB_NAME", "database_test"),
    appUser: getEnv("DB_USER", "bookshelf_app"),
    appPassword: getEnv("DB_PASSWORD", ""),
    appUserHost: getEnv("DB_USER_HOST", "localhost"),
    authPlugin: getEnv("DB_AUTH_PLUGIN", "mysql_native_password"),
    resetOnSetup: /^true$/i.test(getEnv("DB_RESET_ON_START", "true"))
  };

  validateIdentifier("DB_NAME", config.appDatabase);
  validateIdentifier("TEST_DB_NAME", config.testDatabase);
  validateIdentifier("DB_USER", config.appUser);
  validateAccountPart("DB_USER_HOST", config.appUserHost);

  if (config.authPlugin !== "default" && !/^[A-Za-z0-9_]+$/.test(config.authPlugin)) {
    throw new Error(
      "DB_AUTH_PLUGIN contains unsupported characters. Use letters, numbers, and underscore."
    );
  }

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
    host: getEnv("DB_HOST", "127.0.0.1"),
    port: parseInt(getEnv("DB_PORT", "3306"), 10),
    user: config.appUser,
    password: config.appPassword
  };

  var sql = buildSql(config);

  try {
    checkMysqlConnection(rootTcpConnection);
    runMysqlCli(rootTcpConnection, sql);
  } catch (rootErr) {
    // Fallback: on some local installs root only works via socket authentication.
    var socketRootConnection = {
      useTcp: false,
      user: config.rootUser,
      password: ""
    };

    try {
      checkMysqlConnection(socketRootConnection);
      runMysqlCli(socketRootConnection, sql);
      console.log("Database setup used local socket authentication for admin user.");
    } catch (socketErr) {
      try {
        if (config.resetOnSetup) {
          throw new Error("DB_RESET_ON_START=true requires admin credentials.");
        }

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
              appErr.message +
              ". Update MYSQL_ADMIN_USER / MYSQL_ADMIN_PASSWORD (or MYSQL_ROOT_USER / MYSQL_ROOT_PASSWORD) in .env."
          );
        }
      }
    }
  }

  console.log(
    "Database setup complete. User '" +
      config.appUser +
      "'@" +
      "'" +
      config.appUserHost +
      "'" +
      " has access to '" +
      config.appDatabase +
      "' and '" +
      config.testDatabase +
      "'."
  );
}

try {
  setupDatabase();
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exit(1);
}
