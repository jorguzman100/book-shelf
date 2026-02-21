require("./load-env");

function resolvePort(value, defaultPort) {
  var parsedPort = parseInt(value, 10);
  if (Number.isNaN(parsedPort)) {
    return defaultPort;
  }

  return parsedPort;
}

function resolveLogging() {
  return /^true$/i.test(process.env.SEQUELIZE_LOGGING || "") ? console.log : false;
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "127.0.0.1",
    port: resolvePort(process.env.DB_PORT, 3306),
    dialect: "mysql",
    logging: resolveLogging()
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || "database_test",
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || "127.0.0.1",
    port: resolvePort(process.env.TEST_DB_PORT || process.env.DB_PORT, 3306),
    dialect: "mysql",
    logging: resolveLogging()
  },
  production: {
    use_env_variable: "JAWSDB_URL",
    dialect: "mysql",
    logging: resolveLogging()
  }
};
