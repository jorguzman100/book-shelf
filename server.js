require("./config/load-env");
var express = require("express");
var path = require("path");
var fs = require("fs");

var session = require("express-session");
var passport = require("./config/passport");
var SequelizeSessionStore = require("./config/session-store");
var csrfMiddleware = require("./config/middleware/csrf");
var compression = require("compression");

var app = express();
var PORT = process.env.PORT || 8090;
var isProduction = process.env.NODE_ENV === "production";

app.use(compression());

app.use(function applySecurityHeaders(req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' https://ajax.googleapis.com https://cdn.jsdelivr.net https://stackpath.bootstrapcdn.com https://momentjs.com",
      "style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://stackpath.bootstrapcdn.com https://fonts.gstatic.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'"
    ].join("; ")
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }

  next();
});

var db = require("./models");
var sessionStore = new SequelizeSessionStore(db.Session);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.static("public"));

if (!process.env.SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET environment variable.");
}

if (isProduction) {
  // Required for secure cookies behind a reverse proxy in production deployments.
  app.set("trust proxy", 1);
}

app.use(
  session({
    name: "good_reader.sid",
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(function exposeCurrentUser(req, res, next) {
  res.locals.currentUser = req.user || null;
  next();
});
app.use(csrfMiddleware.ensureCsrfToken);
app.use(csrfMiddleware.verifyCsrfToken);

require("./routes/html-routes.js")(app);
require("./routes/user-api-routes.js")(app);
require("./routes/book-api-routes.js")(app);
require("./routes/shoppingcart-api-routes.js")(app);
require("./routes/purchase-api-routes.js")(app);

function readBooksSeedSql() {
  var sqlPath = path.join(__dirname, "books.sql");

  if (!fs.existsSync(sqlPath)) {
    return "";
  }

  var sql = fs.readFileSync(sqlPath, "utf8").trim();
  if (!sql) {
    return "";
  }

  // Ensure the seed targets Sequelize's default pluralized table name.
  return sql.replace(/INSERT\s+INTO\s+`?books`?/i, "INSERT INTO `Books`");
}

function seedBooksIfNeeded() {
  return db.Book.count()
    .then(function(count) {
      if (count > 0) {
        console.log("Book seed skipped: Books table already has", count, "rows.");
        return null;
      }

      var seedSql = readBooksSeedSql();
      if (!seedSql) {
        console.warn("Book seed skipped: books.sql not found or empty.");
        return null;
      }

      console.log("Books table is empty. Loading seed data from books.sql...");
      return db.sequelize.query(seedSql).then(function() {
        return db.Book.count().then(function(seedCount) {
          console.log("Book seed complete. Inserted", seedCount, "rows into Books.");
        });
      });
    })
    .catch(function(err) {
      console.warn("Book seed step failed:", err.message);
    });
}

db.sequelize
  .sync()
  .then(function() {
    return seedBooksIfNeeded();
  })
  .then(function() {
    app.listen(PORT, function() {
      console.log("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
    });
  })
  .catch(function(err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  });
