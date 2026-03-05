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

function buildDbConfig(databaseName) {
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName,
    host: process.env.DB_HOST || "127.0.0.1",
    port: resolvePort(process.env.DB_PORT, 3306),
    dialect: "mysql",
    logging: resolveLogging()
  };
}

module.exports = {
  development: buildDbConfig(process.env.DB_NAME || "good_reader_db"),
  test: buildDbConfig("database_test"),
  production: buildDbConfig(process.env.DB_NAME || "good_reader_db")
};
