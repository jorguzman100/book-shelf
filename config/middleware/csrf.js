var crypto = require("crypto");

var SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function toBuffer(value) {
  if (typeof value !== "string") {
    return null;
  }

  return Buffer.from(value, "utf8");
}

function tokensMatch(expectedToken, providedToken) {
  var expectedBuffer = toBuffer(expectedToken);
  var providedBuffer = toBuffer(providedToken);

  if (!expectedBuffer || !providedBuffer) {
    return false;
  }

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function ensureCsrfToken(req, res, next) {
  if (req.session && typeof req.session.csrfToken !== "string") {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  res.locals.csrfToken = req.session ? req.session.csrfToken : "";
  next();
}

function verifyCsrfToken(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  var expectedToken = req.session && req.session.csrfToken;
  var providedToken =
    req.get("x-csrf-token") ||
    (req.body && req.body._csrf) ||
    (req.query && req.query._csrf);

  if (tokensMatch(expectedToken, providedToken)) {
    return next();
  }

  return res.status(403).json({ message: "Invalid CSRF token." });
}

module.exports = {
  ensureCsrfToken: ensureCsrfToken,
  verifyCsrfToken: verifyCsrfToken
};
