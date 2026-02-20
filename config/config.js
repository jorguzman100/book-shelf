require("./load-env");

function resolvePort(value, defaultPort) {
  var parsedPort = parseInt(value, 10);
  if (Number.isNaN(parsedPort)) {
    return defaultPort;
  }

  return parsedPort;
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "127.0.0.1",
    port: resolvePort(process.env.DB_PORT, 3306),
    dialect: "mysql"
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || "database_test",
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || "127.0.0.1",
    port: resolvePort(process.env.TEST_DB_PORT || process.env.DB_PORT, 3306),
    dialect: "mysql"
  },
  production: {
    use_env_variable: "JAWSDB_URL",
    dialect: "mysql"
  }
};
