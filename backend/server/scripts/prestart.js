require("../config/load-env");
var spawnSync = require("child_process").spawnSync;

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

runDbSetup();
