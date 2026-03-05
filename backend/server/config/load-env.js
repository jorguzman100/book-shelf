var fs = require("fs");
var path = require("path");

var ENV_FILE = path.join(process.cwd(), ".env");

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  var fileContents = fs.readFileSync(filePath, "utf8");

  fileContents.split(/\r?\n/).forEach(function(line) {
    var trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    var separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    var key = trimmedLine.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      return;
    }

    var value = trimmedLine.slice(separatorIndex + 1).trim();
    process.env[key] = stripWrappingQuotes(value);
  });
}

loadEnvFile(ENV_FILE);
