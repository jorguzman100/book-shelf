require("../config/load-env");
var spawnSync = require("child_process").spawnSync;

function isTrue(value) {
  return /^true$/i.test(String(value || ""));
}

function hasValue(value) {
  return typeof value === "string" && value.trim() !== "";
}

function runDbSetup() {
  var npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  var result = spawnSync(npmCommand, ["run", "db:setup"], {
    stdio: "inherit",
    env: process.env
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

var dbSetupOnStart = process.env.DB_SETUP_ON_START;
var hasManagedDbUrl = hasValue(process.env.DATABASE_URL) || hasValue(process.env.JAWSDB_URL);
var isProduction = process.env.NODE_ENV === "production";
var runningOnRender = isTrue(process.env.RENDER);

if (/^false$/i.test(String(dbSetupOnStart || ""))) {
  console.log("Skipping DB bootstrap: DB_SETUP_ON_START=false");
  process.exit(0);
}

if (isProduction || runningOnRender || hasManagedDbUrl) {
  console.log("Skipping DB bootstrap for hosted/production startup.");
  process.exit(0);
}

runDbSetup();
